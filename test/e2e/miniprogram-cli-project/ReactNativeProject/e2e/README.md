# Detox E2E 测试指南

本目录包含使用 [Detox](https://wix.github.io/Detox/) 框架的 React Native E2E 自动化测试。

## 环境准备

### 1. 全局安装 Detox CLI

```bash
npm install -g detox-cli
```

### 2. 安装项目依赖

在 `ReactNativeProject` 目录下运行：

```bash
npm install
```

### iOS 特定准备

1. 安装 Xcode Command Line Tools：
```bash
xcode-select --install
```

2. 安装 applesimutils：
```bash
brew tap wix/brew
brew install applesimutils
```

3. 安装 CocoaPods 依赖：
```bash
cd ios
pod install
cd ..
```

### Android 特定准备

1. 确保已安装 Android Studio 和 Android SDK
2. 配置 `ANDROID_HOME` 环境变量
3. 创建一个 AVD (Android Virtual Device)，建议使用：
   - Device: Pixel 3a
   - API Level: 34 (Android 14)
   - AVD Name: `Pixel_3a_API_34`

创建 AVD：
```bash
# 通过 Android Studio 的 AVD Manager 创建
# 或使用命令行：
avdmanager create avd -n Pixel_3a_API_34 -k "system-images;android-34;google_apis;x86_64"
```

## 运行测试

### iOS 测试

#### Debug 模式（推荐用于开发）

1. **启动 Metro Bundler**（在一个终端窗口中）：
```bash
npm start
```
保持这个终端窗口运行，不要关闭！

2. **构建测试应用**（在另一个终端窗口中）：
```bash
npm run e2e:build:ios
```

3. **运行测试**（在第二个终端窗口中）：
```bash
npm run e2e:test:ios
```

#### Release 模式（不需要 Metro）

1. 构建 Release 测试应用：
```bash
npm run e2e:build:ios:release
```

2. 运行测试：
```bash
npm run e2e:test:ios:release
```

### Android 测试

#### Debug 模式（推荐用于开发）

1. **启动 Metro Bundler**（在一个终端窗口中）：
```bash
npm start
```
保持这个终端窗口运行，不要关闭！

2. **启动模拟器**（在另一个终端窗口中）：
```bash
emulator -avd Pixel_3a_API_34
```

3. **构建测试应用**（在第二个终端窗口中）：
```bash
npm run e2e:build:android
```

4. **运行测试**（在第二个终端窗口中）：
```bash
npm run e2e:test:android
```

#### Release 模式（不需要 Metro）

1. 启动模拟器：
```bash
emulator -avd Pixel_3a_API_34
```

2. 构建 Release 测试应用：
```bash
npm run e2e:build:android:release
```

3. 运行测试：
```bash
npm run e2e:test:android:release
```

## 测试文件结构

```
e2e/
├── jest.config.js      # Jest 配置文件
├── starter.test.js     # 示例测试用例
└── README.md           # 本文件
```

## 编写测试用例

### 基本测试结构

```javascript
describe('测试套件名称', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('测试用例描述', async () => {
    // 查找元素
    await expect(element(by.text('Hello World'))).toBeVisible()
    
    // 点击元素
    await element(by.id('button')).tap()
    
    // 输入文本
    await element(by.id('input')).typeText('Hello')
    
    // 等待元素出现
    await waitFor(element(by.id('result')))
      .toBeVisible()
      .withTimeout(3000)
  })
})
```

### 常用 Detox API

#### 元素查找（Matchers）

```javascript
by.id('uniqueId')           // 通过 testID 查找
by.text('文本内容')          // 通过文本查找
by.label('label')           // 通过 accessibility label 查找
by.type('RCTImageView')     // 通过类型查找
```

#### 操作（Actions）

```javascript
element(by.id('button')).tap()                    // 点击
element(by.id('input')).typeText('text')         // 输入文本
element(by.id('input')).clearText()              // 清除文本
element(by.id('scrollView')).scroll(100, 'down') // 滚动
element(by.id('element')).swipe('up', 'fast')    // 滑动
```

#### 断言（Expectations）

```javascript
await expect(element(by.id('element'))).toBeVisible()       // 可见
await expect(element(by.id('element'))).toExist()           // 存在
await expect(element(by.id('element'))).toHaveText('text')  // 包含文本
await expect(element(by.id('element'))).toHaveValue('val')  // 有值
```

#### 等待（Waiters）

```javascript
await waitFor(element(by.id('element')))
  .toBeVisible()
  .withTimeout(3000)
```

## 调试技巧

### 1. 查看运行日志

使用 `--loglevel` 参数：
```bash
detox test --configuration android.emu.debug --loglevel trace
```

### 2. 录制测试视频

在测试失败时自动录制视频，在 `.detoxrc.js` 中配置：
```javascript
configurations: {
  'android.emu.debug': {
    device: 'emulator',
    app: 'android.debug',
    artifacts: {
      rootDir: './e2e/artifacts',
      plugins: {
        video: 'failing'
      }
    }
  }
}
```

### 3. 截图调试

在测试中添加截图：
```javascript
await device.takeScreenshot('screenshot-name')
```

### 4. 单独运行某个测试

```bash
detox test --configuration android.emu.debug -f "测试名称"
```

## 常见问题

### 通用问题

**Q: 应用显示红屏错误 "No script URL provided"**  
A: 这是因为没有启动 Metro Bundler。在运行 Debug 模式测试前，必须先运行 `npm start` 启动 Metro，并保持它运行。或者使用 Release 模式测试（不需要 Metro）。

**Q: Debug 模式和 Release 模式有什么区别？**  
A: 
- **Debug 模式**：需要 Metro Bundler 提供 JS 代码，构建快，适合开发调试
- **Release 模式**：JS 代码打包到应用中，不需要 Metro，构建慢，接近生产环境

### iOS 问题

**Q: 提示找不到模拟器**  
A: 在 `.detoxrc.js` 中修改 `device.type` 为你系统中存在的模拟器型号

**Q: 构建失败**  
A: 先尝试在 Xcode 中手动构建项目，确保项目本身可以正常编译

### Android 问题

**Q: 提示 AVD 不存在**  
A: 修改 `.detoxrc.js` 中的 `avdName` 为你创建的 AVD 名称

**Q: 模拟器启动失败**  
A: 确保 `ANDROID_HOME` 环境变量已正确设置，且 AVD 已创建

## 配置文件说明

### .detoxrc.js

主要配置项：

- `testRunner`: 配置测试运行器（Jest）
- `apps`: 定义不同平台和构建类型的应用配置
- `devices`: 定义模拟器/真机配置
- `configurations`: 组合 app 和 device 的配置

## 更多资源

- [Detox 官方文档](https://wix.github.io/Detox/)
- [Detox API 参考](https://wix.github.io/Detox/docs/api/actions)
- [Jest 断言 API](https://jestjs.io/docs/expect)
- [示例项目](https://github.com/wix/Detox/tree/master/examples)

## CI/CD 集成

在 CI 环境中运行 Detox 测试，可以参考：
- [GitHub Actions](https://wix.github.io/Detox/docs/guide/github-actions)
- [CircleCI](https://wix.github.io/Detox/docs/guide/circleci)

