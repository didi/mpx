import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import dotenv from 'dotenv'
import { agentFromAdbDevice, getConnectedDevices } from '@midscene/android'

const PROJECT_ROOT = path.resolve(__dirname, '..')
const ENV_FILE = path.join(PROJECT_ROOT, '.env.midscene')

dotenv.config({ path: ENV_FILE })

process.env.MIDSCENE_RUN_DIR ||= path.join(PROJECT_ROOT, 'artifacts', 'midscene')
process.env.MIDSCENE_PREFERRED_LANGUAGE ||= 'zh-CN'

const DEFAULT_APP_ID = 'com.reactnativeproject'
const TEST_ID = 'mpx-rn-android-smoke'

function readEnv(name: string) {
  return process.env[name]?.trim()
}

function requireModelConfig() {
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

async function resolveDeviceId() {
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

async function assertAppInstalled(
  agent: Awaited<ReturnType<typeof agentFromAdbDevice>>,
  appId: string
) {
  const packagePath = await agent.runAdbShell(`pm path ${appId}`)

  if (!packagePath.trim()) {
    throw new Error(
      `App ${appId} is not installed on the selected device. ` +
        'Build and install the RN app before running the Midscene smoke script.'
    )
  }
}

async function main() {
  requireModelConfig()

  const runDir = process.env.MIDSCENE_RUN_DIR!
  await fs.mkdir(runDir, { recursive: true })

  const deviceId = await resolveDeviceId()
  const appId = readEnv('MIDSCENE_ANDROID_APP_ID') || DEFAULT_APP_ID
  const reportFileName = `${TEST_ID}-${new Date().toISOString().replace(/[:.]/g, '-')}`

  let agent: Awaited<ReturnType<typeof agentFromAdbDevice>> | null = null

  try {
    agent = await agentFromAdbDevice(deviceId, {
      testId: TEST_ID,
      groupName: 'MPX RN Android Midscene Smoke',
      groupDescription: 'Launch the RN demo, open scroll-view, switch to horizontal mode, then return home.',
      generateReport: true,
      outputFormat: 'html-and-external-assets',
      reportFileName,
      waitAfterAction: 1200
    })

    console.log(`[midscene] Using device: ${deviceId}`)
    console.log(`[midscene] Using app: ${appId}`)
    console.log(`[midscene] Run dir: ${runDir}`)

    await assertAppInstalled(agent, appId)
    await agent.recordToReport('Smoke Config', {
      content: JSON.stringify(
        {
          deviceId,
          appId,
          envFile: ENV_FILE,
          runDir
        },
        null,
        2
      )
    })

    await agent.launch(appId)

    await agent.aiWaitFor(
      '当前屏幕上能看到标题“MPX 组件测试”，并且组件列表里存在“scroll-view”这一项',
      { timeoutMs: 30000, checkIntervalMs: 1500 }
    )
    await agent.aiAssert('首页标题是“MPX 组件测试”', '首页标题应正确渲染')

    await agent.aiTap('组件列表中名字是“scroll-view”的卡片')
    await agent.aiWaitFor(
      '已经进入 scroll-view 组件测试页面，并且能看到“滚动到顶部”和“滚动到 item-5”按钮',
      { timeoutMs: 30000, checkIntervalMs: 1500 }
    )
    await agent.aiAssert('当前测试类型显示为“纵向滚动”', 'scroll-view 页面默认应为纵向模式')

    await agent.aiTap('测试类型切换区域中的“横向滚动”按钮')
    await agent.aiWaitFor(
      '当前测试类型显示为“横向滚动”，并且页面中可以看到一个横向滚动列表区域',
      { timeoutMs: 30000, checkIntervalMs: 1500 }
    )
    await agent.aiTap('按钮“滚动到 item-5”')
    await agent.aiWaitFor(
      '事件记录区域显示“滚动到 item-5”，或者横向列表已经滚动到第 5 项附近',
      { timeoutMs: 30000, checkIntervalMs: 1500 }
    )
    await agent.aiAssert(
      '当前页面仍然在 scroll-view 组件测试页，而且当前测试类型是“横向滚动”',
      '横向滚动切换后页面状态应保持正确'
    )

    await agent.back()
    await agent.aiWaitFor('当前已经回到标题为“MPX 组件测试”的首页', {
      timeoutMs: 30000,
      checkIntervalMs: 1500
    })

    console.log('[midscene] Smoke test passed.')
    if (agent.reportFile) {
      console.log(`[midscene] Report: ${agent.reportFile}`)
    }
  } finally {
    if (agent) {
      if (agent.reportFile) {
        console.log(`[midscene] Final report: ${agent.reportFile}`)
      }
      await agent.destroy()
    }
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error)
  console.error('[midscene] Smoke test failed.')
  console.error(message)
  process.exitCode = 1
})
