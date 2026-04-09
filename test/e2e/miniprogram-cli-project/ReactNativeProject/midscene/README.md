# Midscene Android Smoke

This directory contains a minimal Midscene smoke script for the Mpx React Native demo.

## What It Checks

The smoke flow covers one stable, representative path:

1. Launch the installed Android app
2. Wait for the home page title `MPX 组件测试`
3. Open the `scroll-view` demo page
4. Switch from `纵向滚动` to `横向滚动`
5. Trigger `滚动到 item-5`
6. Go back to the home page

## Prerequisites

- An Android device or emulator is visible in `adb devices`
- The RN app is already installed on that device
- Midscene model variables are available via environment variables or `ReactNativeProject/.env.midscene`

The script defaults to app id `com.reactnativeproject`.

## Environment

The script automatically loads `ReactNativeProject/.env.midscene` if present.
Example variables are listed in [`.env.midscene.example`](/Users/didi/Work/Code/mpx/test/e2e/miniprogram-cli-project/ReactNativeProject/.env.midscene.example).

## Run

From `ReactNativeProject`:

```bash
npm run midscene:smoke:android
npm run midscene:visual:update-baseline:android
npm run midscene:visual:android
```

This command first runs `midscene:prepare`, which checks whether the local `sharp`
runtime can load on the current machine and repairs it if needed.

From the demo root:

```bash
npm run midscene:smoke:android
npm run midscene:visual:update-baseline:android
npm run midscene:visual:android
```

## Visual Regression Check

Use the commands in this order:

1. `midscene:visual:update-baseline:android`
   Save a known-good screenshot from the `正确布局` state as the baseline reference image.
2. `midscene:visual:android`
   Re-open the page with the saved baseline fixed, then switch through three anomaly scenarios and fail the run whenever Midscene sees visible differences in the demo area:
   - `左右布局变化`
   - `间距变化`
   - `1 像素变化`

For simplicity, the current implementation compares one stable single-screen region only.
The saved image is cropped to the `visualStoryBoard` demo area instead of the full device screen.

The reference image is saved under `artifacts/midscene/reference-images` by default.
If you want to keep a persistent reference image elsewhere, set
`MIDSCENE_VISUAL_REFERENCE_PATH` in `.env.midscene`.

`midscene:visual:android` no longer refreshes the baseline automatically. This is intentional:
in a gate-style visual regression check, any visible difference from the baseline should make the case fail instead of silently accepting the new screenshot.

## Output

- Default run directory: `ReactNativeProject/artifacts/midscene`
- The script enables Midscene report generation and prints the final report path after execution
