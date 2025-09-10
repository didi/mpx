Mpx 可通过输出为 React Native 代码实现直接在 ios、android 中作为 App 运行。

### 1. 创建新项目

```bash
# 使用 Mpx CLI 创建支持 RN 的项目
npx @mpxjs/cli@latest create my-rn-app

# 选择包含 React Native 支持的模板
# ? 是否需要输出react-native Yes
```

> 框架仅负责将 Mpx 项目输出为 React Native 代码，而后 React Native 代码的编译构建完全由 React Native 项目完成。
>
> 选择 “是否需要输出react-native” 后，默认 Mpx 项目将包含一个由 @react-native-community/cli 创建的名为 ReactNativeProject 的 React Native 项目，以便用于对 React Native 代码的开发调试和编译。

### 2. 项目结构

```
my-rn-app/
├── src/                    # 源码目录
│   ├── pages/              # 页面目录
│   ├── components/         # 组件目录
│   ├── utils/              # 工具函数
│   ├── store/              # 状态管理
│   ├── app.mpx             # 应用入口
│   └── app.json            # 应用配置
├── ReactNativeProject/     # React Native 项目目录
│   ├── android/            # Android 项目
│   ├── ios/                # iOS 项目
│   ├── index.js            # RN 入口文件(同时也是Mpx的输出产物)
│   └── package.json        # RN 依赖
├── dist/                   # 编译输出
│   └── react-native/       # RN 编译结果
└── mpx.config.js           # 构建配置
```

### 3. 开发调试

```bash
# 运行 IOS 应用
npm run serve:ios

# 运行 Android 应用
npm run serve:android
```


### 4. 构建

```bash
# 编译到 IOS
npm run build:ios

# 编译到 Android
npm run build:android
```
