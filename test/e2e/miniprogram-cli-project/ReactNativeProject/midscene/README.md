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
```

This command first runs `midscene:prepare`, which checks whether the local `sharp`
runtime can load on the current machine and repairs it if needed.

From the demo root:

```bash
npm run midscene:smoke:android
```

## Output

- Default run directory: `ReactNativeProject/artifacts/midscene`
- The script enables Midscene report generation and prints the final report path after execution
