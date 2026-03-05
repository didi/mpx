# 脚手架工具 {#cli}

Mpx 提供了一个基于 [@vue/cli](https://cli.vuejs.org/zh/) 的脚手架工具 `@mpxjs/cli`，用于快速初始化和管理 Mpx 项目。它继承了 Vue CLI 的强大功能，如零配置原型开发、插件系统、图形化界面等，并针对小程序开发进行了深度定制。

## 安装 {#install}

请确保你的环境中有 Node.js (>= 10)。

```bash
# 全局安装 @mpxjs/cli
npm install -g @mpxjs/cli
```

## 初始化项目 {#create}

使用 `create` 命令创建一个新项目：

```bash
mpx create my-project
```

在创建过程中，CLI 会通过交互式问答引导你配置项目：

1.  **项目描述/作者**：基础元信息。
2.  **跨平台支持**：选择是否需要支持 支付宝/百度/头条/QQ 等小程序平台，以及 Web 和 React Native 平台。
3.  **TypeScript**：是否使用 TypeScript 进行开发。
4.  **CSS 预处理器**：选择 Stylus, Less 或 Sass。
5.  **Linter / Formatter**：选择 ESLint 配置。
6.  **测试支持**：是否需要单元测试 (Jest) 或 E2E 测试。
7.  **云开发**：是否使用微信云开发。

初始化完成后，进入项目目录并安装依赖：

```bash
cd my-project
npm install
```

## 常用命令 {#commands}

### 开发模式 {#serve}

启动开发服务器，监听文件变化并自动重新构建：

```bash
npm run serve
```

默认情况下，构建产物会输出到 `dist/wx` 目录（以微信小程序为例）。你可以使用微信开发者工具打开该目录进行预览和调试。

如果你需要调试其他平台，可以使用对应的 script，例如：

```bash
npm run serve:ali  # 支付宝小程序
npm run serve:swan # 百度小程序
npm run serve:tt   # 字节跳动小程序
npm run serve:web  # Web 平台
```

### 生产构建 {#build}

构建用于生产环境的代码（压缩、混淆、去除冗余代码等）：

```bash
npm run build
```

同样支持不同平台的构建命令：

```bash
npm run build:ali
npm run build:web
# ...
```

### 审查项目配置 {#inspect}

查看项目最终生成的 webpack 配置：

```bash
npm run inspect
```

## 配置文件 {#config}

由于 `@mpxjs/cli` 是基于 Vue CLI 的，项目的主要配置文件为根目录下的 `vue.config.js`。你可以在这里配置 webpack、Mpx 插件选项等。

### 示例配置

```javascript
// vue.config.js
module.exports = {
  outputDir: `dist/${process.env.MPX_CURRENT_TARGET_MODE || 'wx'}`,
  pluginOptions: {
    mpx: {
      // Mpx 插件配置
      srcMode: 'wx', // 源码模式，默认为 wx
      plugin: {
        // mpx-webpack-plugin 配置
        hackResolve: true
      },
      loader: {
        // mpx-loader 配置
      }
    }
  },
  configureWebpack: {
    // 自定义 webpack 配置
    resolve: {
      alias: {
        '@': 'src'
      }
    }
  }
}
```

## 插件系统 {#plugins}

`@mpxjs/cli` 使用了 Vue CLI 的插件架构。这意味着你可以使用现有的 Vue CLI 插件，也可以使用 Mpx 专属插件。

在项目初始化时选择的特性（如 TypeScript、Transpilation 等）都是以插件的形式注入到项目中的。

更多关于插件开发的文档，请参考 [Vue CLI 插件开发指南](https://cli.vuejs.org/zh/dev-guide/plugin-dev.html)。

## 旧版迁移 {#migration}

如果你之前使用的是 `mpx init` (基于 `mpx-cli` 2.x 或更早版本)，建议升级到新的 `@mpxjs/cli`。

1.  卸载旧版：`npm uninstall -g mpx-cli`
2.  安装新版：`npm install -g @mpxjs/cli`
3.  新版使用 `mpx create` 代替 `mpx init`。

## 参考文档 {#reference}

*   [@mpxjs/cli GitHub 仓库](https://github.com/mpx-ecology/mpx-cli)
*   [Vue CLI 官方文档](https://cli.vuejs.org/zh/)
