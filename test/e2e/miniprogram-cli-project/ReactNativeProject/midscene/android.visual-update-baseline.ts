import fs from 'node:fs/promises'

import { agentFromAdbDevice } from '@midscene/android'

import {
  DEFAULT_APP_ID,
  assertAppInstalled,
  captureVisualRegressionViewport,
  openVisualRegressionPage,
  readEnv,
  resolveDeviceId,
  resolveReferenceImagePath,
  requireModelConfig,
  scrollVisualRegressionPageToTop,
  switchToBaselineLayout
} from './visual.shared'

const TEST_ID = 'mpx-rn-android-visual-update-baseline'

async function main() {
  requireModelConfig()

  const runDir = process.env.MIDSCENE_RUN_DIR!
  await fs.mkdir(runDir, { recursive: true })

  const deviceId = await resolveDeviceId()
  const appId = readEnv('MIDSCENE_ANDROID_APP_ID') || DEFAULT_APP_ID
  const referenceImagePath = resolveReferenceImagePath(runDir)
  const reportFileName = `${TEST_ID}-${new Date().toISOString().replace(/[:.]/g, '-')}`

  let agent: Awaited<ReturnType<typeof agentFromAdbDevice>> | null = null

  try {
    agent = await agentFromAdbDevice(deviceId, {
      testId: TEST_ID,
      groupName: 'MPX RN Android Visual Baseline Update',
      groupDescription:
        'Open the visual-regression page in the correct mode and refresh the saved single-screen demo baseline reference image.',
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

    await agent.launch(appId)
    await openVisualRegressionPage(agent, appId)
    await switchToBaselineLayout(agent)
    await scrollVisualRegressionPageToTop(agent, deviceId)

    await captureVisualRegressionViewport(deviceId, referenceImagePath)
    await agent.recordToReport('Updated Visual Baseline', {
      content: JSON.stringify(
        {
          deviceId,
          appId,
          referenceImagePath,
          captureScope: 'visualStoryBoard only'
        },
        null,
        2
      )
    })

    await agent.back()
    await agent.aiWaitFor('当前已经回到标题为“MPX 组件测试”的首页', {
      timeoutMs: 30000,
      checkIntervalMs: 1500
    })

    console.log('[midscene] Visual baseline updated.')
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
  console.error('[midscene] Visual baseline update failed.')
  console.error(message)
  process.exitCode = 1
})
