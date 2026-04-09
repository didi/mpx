import { spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import dotenv from 'dotenv'
import { agentFromAdbDevice, getConnectedDevices } from '@midscene/android'

export const PROJECT_ROOT = path.resolve(__dirname, '..')
export const ENV_FILE = path.join(PROJECT_ROOT, '.env.midscene')
export const DEFAULT_APP_ID = 'com.reactnativeproject'

dotenv.config({ path: ENV_FILE })

process.env.MIDSCENE_RUN_DIR ||= path.join(PROJECT_ROOT, 'artifacts', 'midscene')
process.env.MIDSCENE_PREFERRED_LANGUAGE ||= 'zh-CN'

export type AndroidAgentInstance = Awaited<ReturnType<typeof agentFromAdbDevice>>
export type VisualMode = 'baseline' | 'layout' | 'spacing' | 'pixel'
type RectBounds = {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

const VISUAL_PAGE_RESOURCE_ID = 'visualRegressionPage'
const VISUAL_CAPTURE_RESOURCE_ID = 'visualStoryBoard'
const VISUAL_PAGE_TITLE = '视觉回归检测'
const VISUAL_MODE_LABEL_MAP: Record<VisualMode, string> = {
  baseline: '正确布局',
  layout: '左右布局变化',
  spacing: '间距变化',
  pixel: '1 像素变化'
}

function getAdbPath() {
  return readEnv('MIDSCENE_ADB_PATH') || 'adb'
}

function runAdb(deviceId: string, args: string[]) {
  return spawnSync(getAdbPath(), ['-s', deviceId, ...args], {
    maxBuffer: 20 * 1024 * 1024
  })
}

function readAdbStdout(result: ReturnType<typeof spawnSync>, errorPrefix: string): Buffer {
  if (result.status !== 0) {
    const errorMessage = result.stderr?.toString().trim() || 'unknown adb error'
    throw new Error(`${errorPrefix}: ${errorMessage}`)
  }

  const stdout = result.stdout
  if (!stdout?.length) {
    throw new Error(`${errorPrefix}: command returned empty output.`)
  }

  return Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout)
}

function parseBounds(xml: string, resourceId: string): RectBounds {
  const resourcePattern = resourceId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = xml.match(
    new RegExp(
      `resource-id="${resourcePattern}"[\\s\\S]*?bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`
    )
  )

  if (!match) {
    throw new Error(`Unable to locate bounds for resource-id "${resourceId}".`)
  }

  const left = Number(match[1])
  const top = Number(match[2])
  const right = Number(match[3])
  const bottom = Number(match[4])

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top
  }
}

async function cropScreenshotToBounds(imageBuffer: Buffer, bounds: RectBounds) {
  const sharpModule = await import('sharp')
  const sharp = sharpModule.default

  return sharp(imageBuffer)
    .extract({
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height
    })
    .png()
    .toBuffer()
}

async function dumpUiHierarchyXml(deviceId: string) {
  const remoteXmlPath = '/sdcard/midscene-visual-ui.xml'
  const dumpResult = runAdb(deviceId, ['shell', 'uiautomator', 'dump', remoteXmlPath])

  if (dumpResult.status !== 0) {
    const errorMessage = dumpResult.stderr?.toString().trim() || 'unknown adb error'
    throw new Error(`Failed to dump Android UI hierarchy: ${errorMessage}`)
  }

  const readResult = runAdb(deviceId, ['exec-out', 'cat', remoteXmlPath])
  return readAdbStdout(readResult, 'Failed to read Android UI hierarchy').toString()
}

export function readEnv(name: string) {
  return process.env[name]?.trim()
}

export function requireModelConfig() {
  const missing: string[] = []
  const modelName = readEnv('MIDSCENE_MODEL_NAME')
  const modelFamily = readEnv('MIDSCENE_MODEL_FAMILY')
  const apiKey = readEnv('MIDSCENE_MODEL_API_KEY') || readEnv('OPENAI_API_KEY')

  if (!modelName) missing.push('MIDSCENE_MODEL_NAME')
  if (!modelFamily) missing.push('MIDSCENE_MODEL_FAMILY')
  if (!apiKey) missing.push('MIDSCENE_MODEL_API_KEY')

  if (missing.length) {
    throw new Error(
      `Missing Midscene model config: ${missing.join(', ')}. ` +
        `The script reads ${ENV_FILE} when present.`
    )
  }
}

export async function resolveDeviceId() {
  const explicitDeviceId = readEnv('MIDSCENE_ANDROID_DEVICE_ID')
  if (explicitDeviceId) return explicitDeviceId

  const devices = await getConnectedDevices()
  const onlineDevices = devices.filter((device) => device.state === 'device')

  if (onlineDevices.length === 1) {
    return onlineDevices[0].udid
  }

  if (onlineDevices.length === 0) {
    throw new Error(
      'No Android device detected by adb. Connect a device or start an emulator first.'
    )
  }

  throw new Error(
    `Multiple Android devices are connected: ${onlineDevices.map((device) => device.udid).join(', ')}. ` +
      'Set MIDSCENE_ANDROID_DEVICE_ID to choose one.'
  )
}

export async function assertAppInstalled(agent: AndroidAgentInstance, appId: string) {
  const packagePath = await agent.runAdbShell(`pm path ${appId}`)

  if (!packagePath.trim()) {
    throw new Error(
      `App ${appId} is not installed on the selected device. ` +
        'Build and install the RN app before running the Midscene visual check.'
    )
  }
}

export function resolveReferenceImagePath(runDir: string) {
  const configuredPath = readEnv('MIDSCENE_VISUAL_REFERENCE_PATH')

  if (!configuredPath) {
    return path.join(runDir, 'reference-images', 'visual-layout-baseline.android.png')
  }

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(PROJECT_ROOT, configuredPath)
}

export async function captureDeviceScreenshot(deviceId: string, targetPath: string) {
  const result = runAdb(deviceId, ['exec-out', 'screencap', '-p'])
  const screenshotBuffer = readAdbStdout(result, 'Failed to capture Android screenshot')

  await fs.mkdir(path.dirname(targetPath), { recursive: true })
  await fs.writeFile(targetPath, screenshotBuffer)
}

export async function ensureReferenceImageExists(referenceImagePath: string) {
  try {
    await fs.access(referenceImagePath)
  } catch {
    throw new Error(
      `Reference image not found at ${referenceImagePath}. ` +
        'Run `npm run midscene:visual:update-baseline:android` first to save a known-good baseline.'
    )
  }
}

export async function openVisualRegressionPage(
  agent: AndroidAgentInstance,
  appId: string
) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const onTargetPage = await agent.aiBoolean(
      '当前是否已经在“MPX 组件测试”首页，或者已经在视觉回归检测页？如果页面标题是“功能测试”或其他组件子页面，回答否。'
    )

    if (onTargetPage) break

    const onLauncher = await agent.aiBoolean(
      '当前是否位于 Android 系统桌面或启动器？如果屏幕上主要是日期时间、搜索栏、应用图标，而不是 App 页面，回答是。'
    )

    if (onLauncher) {
      await agent.launch(appId)
      continue
    }

    await agent.back()
  }

  await agent.aiWaitFor(
    '当前屏幕上已经显示“MPX 组件测试”首页，或者已经进入视觉回归检测页。若已进入视觉回归检测页，屏幕上应该能看到“正确布局”“左右布局变化”“间距变化”“1 像素变化”中的若干模式按钮，或者能看到“待检测主区域”标题。',
    { timeoutMs: 30000, checkIntervalMs: 1500 }
  )

  const alreadyOnVisualPage = await agent.aiBoolean(
    '当前是否已经在视觉回归检测页？只有在屏幕上能看到“待检测主区域”标题，或者能看到“正确布局”“左右布局变化”“间距变化”“1 像素变化”这些模式按钮时，才回答是；如果只是首页组件列表里出现“visual-regression”文字，不算已经进入该页面。'
  )

  if (!alreadyOnVisualPage) {
    await agent.aiWaitFor(
      '当前屏幕上能看到标题“MPX 组件测试”，并且组件列表里存在“visual-regression”这一项',
      { timeoutMs: 30000, checkIntervalMs: 1500 }
    )
    await agent.aiTap('组件列表中名字是“visual-regression”的卡片')

    await agent.aiWaitFor(
      `已经进入标题为“${VISUAL_PAGE_TITLE}”的页面，并且页面里能看到“正确布局”“左右布局变化”“间距变化”“1 像素变化”这些模式按钮`,
      { timeoutMs: 30000, checkIntervalMs: 1500 }
    )
  }
}

export async function switchVisualMode(
  agent: AndroidAgentInstance,
  mode: VisualMode
) {
  const modeLabel = VISUAL_MODE_LABEL_MAP[mode]

  const alreadyOnTargetMode = await agent.aiBoolean(
    `当前模式是否已经是“${modeLabel}”？只要当前模式标签明确显示“${modeLabel}”，就回答是。`
  )

  if (!alreadyOnTargetMode) {
    await agent.aiTap(`模式切换区域中写着“${modeLabel}”的按钮`)
  }

  await agent.aiWaitFor(
    `当前模式标签已经显示“${modeLabel}”。`,
    {
      timeoutMs: 30000,
      checkIntervalMs: 1500
    }
  )
}

export async function switchToBaselineLayout(agent: AndroidAgentInstance) {
  await switchVisualMode(agent, 'baseline')
}

export async function scrollVisualRegressionPageToTop(
  agent: AndroidAgentInstance,
  deviceId: string
) {
  const xml = await dumpUiHierarchyXml(deviceId)
  const bounds = parseBounds(xml, VISUAL_PAGE_RESOURCE_ID)
  const centerX = Math.round(bounds.left + bounds.width / 2)
  const startY = Math.round(bounds.top + bounds.height * 0.28)
  const endY = Math.round(bounds.top + bounds.height * 0.88)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await agent.runAdbShell(`input swipe ${centerX} ${startY} ${centerX} ${endY} 220`)
  }
}

export async function captureVisualRegressionViewport(
  deviceId: string,
  targetPath: string
) {
  const xml = await dumpUiHierarchyXml(deviceId)
  const bounds = parseBounds(xml, VISUAL_CAPTURE_RESOURCE_ID)
  const screenshotResult = runAdb(deviceId, ['exec-out', 'screencap', '-p'])
  const screenshotBuffer = readAdbStdout(
    screenshotResult,
    'Failed to capture Android screenshot'
  )
  const croppedBuffer = await cropScreenshotToBounds(screenshotBuffer, bounds)

  await fs.mkdir(path.dirname(targetPath), { recursive: true })
  await fs.writeFile(targetPath, croppedBuffer)
}
