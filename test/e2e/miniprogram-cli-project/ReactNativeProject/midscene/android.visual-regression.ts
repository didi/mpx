import fs from 'node:fs/promises'
import path from 'node:path'

import { agentFromAdbDevice } from '@midscene/android'

import {
  DEFAULT_APP_ID,
  assertAppInstalled,
  captureVisualRegressionViewport,
  ensureReferenceImageExists,
  openVisualRegressionPage,
  readEnv,
  resolveDeviceId,
  resolveReferenceImagePath,
  requireModelConfig,
  scrollVisualRegressionPageToTop,
  switchToBaselineLayout,
  switchVisualMode,
  type VisualMode
} from './visual.shared'

const TEST_ID = 'mpx-rn-android-visual-regression'

type ScenarioCheck = {
  mode: Exclude<VisualMode, 'baseline'>
  label: string
  expectedChange: string
}

type ScenarioResult = ScenarioCheck & {
  currentImagePath: string | null
  hasDifference: boolean
  status: 'passed' | 'failed' | 'error'
  analysis?: string
  error?: string
}

const SCENARIOS: ScenarioCheck[] = [
  {
    mode: 'layout',
    label: '左右布局变化',
    expectedChange: '卡片左右布局变化'
  },
  {
    mode: 'spacing',
    label: '间距变化',
    expectedChange: '上下左右间距变化'
  },
  {
    mode: 'pixel',
    label: '1 像素变化',
    expectedChange: '1 像素变化'
  }
]

const VISUAL_ANALYSIS_PROMPT =
  '只比较附带的两张截图，不要参考当前设备上的其他区域。这两张图都只包含视觉回归 demo 的主区域。请简要分析主区域是否存在视觉差异；如果存在，请概括你观察到的变化位置和变化类型，但不要臆测代码实现。'

const VISUAL_BOOLEAN_PROMPT =
  '只比较附带的两张截图，不要参考当前设备上的其他区域。这两张图都只包含视觉回归 demo 的主区域。如果你判断主区域存在可见差异，包括布局结构、对齐、间距、留白或细微像素级变化，就回答是；如果主区域看起来与基线一致，就回答否。'

async function main() {
  requireModelConfig()

  const runDir = process.env.MIDSCENE_RUN_DIR!
  await fs.mkdir(runDir, { recursive: true })

  const deviceId = await resolveDeviceId()
  const appId = readEnv('MIDSCENE_ANDROID_APP_ID') || DEFAULT_APP_ID
  const referenceImagePath = resolveReferenceImagePath(runDir)
  const reportFileName = `${TEST_ID}-${new Date().toISOString().replace(/[:.]/g, '-')}`
  const scenarioImageDir = path.join(runDir, 'scenario-images')

  let agent: Awaited<ReturnType<typeof agentFromAdbDevice>> | null = null

  try {
    agent = await agentFromAdbDevice(deviceId, {
      testId: TEST_ID,
      groupName: 'MPX RN Android Visual Regression',
      groupDescription:
        'Open the visual-regression page, compare the single-screen demo area with the saved baseline, and fail the case when visible differences are detected.',
      generateReport: true,
      outputFormat: 'html-and-external-assets',
      reportFileName,
      waitAfterAction: 1200
    })

    console.log(`[midscene] Using device: ${deviceId}`)
    console.log(`[midscene] Using app: ${appId}`)
    console.log(`[midscene] Run dir: ${runDir}`)
    console.log(`[midscene] Baseline image: ${referenceImagePath}`)

    await assertAppInstalled(agent, appId)
    await ensureReferenceImageExists(referenceImagePath)
    await fs.mkdir(scenarioImageDir, { recursive: true })

    await agent.launch(appId)
    await openVisualRegressionPage(agent, appId)
    await switchToBaselineLayout(agent)
    await scrollVisualRegressionPageToTop(agent, deviceId)

    await agent.recordToReport('Visual Regression Plan', {
      content: JSON.stringify(
        {
          deviceId,
          appId,
          referenceImagePath,
          captureScope: 'visualStoryBoard only',
          scenarios: SCENARIOS.map(({ mode, label, expectedChange }) => ({
            mode,
            label,
            expectedChange
          }))
        },
        null,
        2
      )
    })

    const results: ScenarioResult[] = []

    for (const scenario of SCENARIOS) {
      const currentImagePath = path.join(
        scenarioImageDir,
        `visual-layout-${scenario.mode}.android.current.png`
      )

      try {
        await scrollVisualRegressionPageToTop(agent, deviceId)
        await switchVisualMode(agent, scenario.mode)
        await captureVisualRegressionViewport(deviceId, currentImagePath)

        const images = [
          {
            name: '正确布局参考图',
            url: referenceImagePath
          },
          {
            name: `${scenario.label} 当前截图`,
            url: currentImagePath
          }
        ]

        const analysis = await agent.aiString({
          prompt: VISUAL_ANALYSIS_PROMPT,
          images
        } as any)

        const hasDifference = await agent.aiBoolean({
          prompt: VISUAL_BOOLEAN_PROMPT,
          images
        } as any)

        const result: ScenarioResult = {
          ...scenario,
          currentImagePath,
          hasDifference,
          status: hasDifference ? 'failed' : 'passed',
          analysis
        }

        results.push(result)

        await agent.recordToReport(`Scenario: ${scenario.label}`, {
          content: JSON.stringify(result, null, 2)
        })
      } catch (error) {
        const message = error instanceof Error ? error.stack || error.message : String(error)
        const result: ScenarioResult = {
          ...scenario,
          currentImagePath: null,
          hasDifference: false,
          status: 'error',
          error: message
        }

        results.push(result)

        await agent.recordToReport(`Scenario: ${scenario.label}`, {
          content: JSON.stringify(result, null, 2)
        })
      }
    }

    const failedScenarios = results.filter((scenario) => scenario.status !== 'passed')

    await agent.recordToReport('Visual Regression Summary', {
      content: JSON.stringify(
        {
          baseline: referenceImagePath,
          results,
          passed: failedScenarios.length === 0
        },
        null,
        2
      )
    })

    try {
      await switchToBaselineLayout(agent)
    } catch {}

    try {
      await agent.back()
      await agent.aiWaitFor('当前已经回到标题为“MPX 组件测试”的首页', {
        timeoutMs: 30000,
        checkIntervalMs: 1500
      })
    } catch {}

    if (failedScenarios.length) {
      throw new Error(
        `视觉回归场景失败: ${failedScenarios
          .map((scenario) =>
            scenario.status === 'error'
              ? `${scenario.label}(执行异常)`
              : `${scenario.label}(检测到差异)`
          )
          .join('、')}`
      )
    }

    console.log('[midscene] Visual regression gate passed.')
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
  console.error('[midscene] Visual scenario detection failed.')
  console.error(message)
  process.exitCode = 1
})
