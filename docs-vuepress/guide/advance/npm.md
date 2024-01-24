# 使用npm

Mpx项目中用户能够方便自然地引用 npm 资源，像 web 开发中一样

在 Mpx 中使用 npm，通过 Webpack 插件在编译时将引用的 npm 包输出为小程序文件，所以 Mpx 的构建产物不需要在开发工具再次进行 npm 构建。

## 下载npm包

在项目 package.json 所在的目录中执行命令安装项目 npm 包

```js
npm install
```
在项目中安装某个第三方 npm 包

```js
npm install mpx-ui
```
如若之前未接触过 npm，请翻阅 [官方 npm 文档](https://docs.npmjs.com/about-npm/index.html) 进行学习。

## 引用npm模块

直接使用模块路径引用，可以直接通过 ES6 的 import 语法来引用 JS 文件，并且无需额外执行npm构建

```js
import { createPage } from '@mpxjs/core'
```

## 引用npm组件/页面

在页面 script 标签中的 json 对象中使用 usingComponents 引入第三方组件，直接使用模块路径引用

```js
<script type="application/json">
  {
    "usingComponents": {
      "mpx-button": "mpx-ui/src/components/button"
    }
  }
</script>
```
在 app.mpx 中的 script 标签中的 pages/packages/subPackages 中都可以声明引用 npm 包页面

示例:
```js
<script type="application/json">
  {
    "pages": [
      "@someGroup/someNpmPackage/pages/view/index.mpx"
    ]
  }
</script>
```
以上这种写法为避免和本地页面路径冲突，Mpx 会将路径进行 hash 化处理，所以使用页面时要在路径后添加 ?resovle 标识符，编译时会被处理成正确的、完整的绝对路径。

```js
import packageIndexPage from '@someGroup/someNpmPackage/pages/view/index.mpx?resolve'

mpx.navigateTo({
  url: packageIndexPage
})
```
如果你觉得上述引用 npm 包页面的方式太繁琐，我们也提供了另一种 page 声明方式，可以让你自定义页面路径

```js
// 声明
{
  "pages": [
    {
      "src": "@someGroup/someNpmPackage/pages/view/index.mpx",
      "path": "pages/somNpmPackage/index" // 注意保持 path 的唯一性
    }
  ]
}

// 使用
// 可以直接使用你自己声明的 path
mpx.navigateTo({
  url: '/pages/somNpmPackage/index'
})
```
同理，我们在使用 subPackages 分包时也可以使用 pages 对象的方式

```js
"subPackages": [
  {
    "root": "test",
    "pages": [
       {
         "src": "@someGroup/someNpmPackage/pages/view/index.mpx",
         "path": "pages/somNpmPackage/index" // 注意保持 path 的唯一性
       }
    ]
  }
]
// 使用
mpx.navigateTo({
  url: '/test/pages/somNpmPackage/index'
})
```

同时使用 Mpx 引用npm组件/页面时包体积比原生中的 npm 规范更优，好处有：

Mpx npm构建的优势主要有两点：1. 按需构建；2. 支持分包

* 小程序的 npm 规范场景下，组件库需声明miniprogram_dist目录，执行构建npm命令，将整个miniprogram_dist中的代码copy到项目的miniprogram_npm目录下。而 Mpx 的 npm 包引用，借助 Webpack 强大的构建分析能力，loader 在解析 json 中的 pages 域和 usingComponents 域中的路径时，通过动态创建 entry 的方式把这些文件添加进来，同时按需加载被确切使用的文件，降低包体积，借助  CommonsChunkPlugin/SplitChunksPlugin 的能力将复用的 js 模块抽出到一个外部公用的 bundle 中。

* 原生小程序的构建中，所有的 npm 模块都会输出到主包中，Mpx 在编译中，还会进行分包处理，对组件和静态资源，根据用户的分包配置，串行对主包和各个分包进行构建，标记出每个组件及静态资源的归属，根据小程序资源访问策略将其输出到主包或者分包中。

所以使用 Mpx 框架开发小程序，可以享受最舒适最自然最好用的 npm 机制，详细原理介绍请移步[Mpx编译构建原理](../understand/compile.md)

## 兼容原生小程序路径规范

组件或者页面的引入有绝对路径和相对路径，或者引入 npm 第三方包，原生小程序中，我们通过相对路径引入一个组件时
```js
{
  "usingComponents": {
    "component-tag-name": "path/to/the/custom/component"
  }
}
```
这种路径形式在 webpack 路径规范中会被当成 npm 包路径来处理，所以要对原生小程序的路径规范做下兼容。

Mpx 提供了两种路径规范的配置模式可供大家选择，具体的使用方式为：

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
         resolveMode: 'webpack'
      }
    }
  }
})
```

在 MpxWebpackPlugin 插件中设置 resolveMode 项，默认值为 webpack，可选值有 webpack/native，推荐使用 webpack 模式，更舒服一些，配置项为 webpack 时，json 中的 pages/usingComponents 等需要写相对路径，但是也可以直接写 npm 包路径。例如：
```js
{
  "usingComponents": {
    "component-tag-name": "./path/to/the/custom/component", // 内部组件路径
    "mpx-button": "mpx-ui/src/components/button" // npm 包路径
  }
}
```

如果希望使用类似小程序原始那种"绝对路径"，可以将 resolveMode 设置为 native，但是 npm 路径需要在前面加一个~，类似 webpack 的样式引入规范，同时必须配合 projectRoot 参数提供项目根目录地址。

resolveMode 为 native 时的使用示例：
```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        resolveMode: 'native',
        // 当resolveMode为native时可通过该字段指定项目根目录
        projectRoot: path.resolve(__dirname, '../src')
      }
    }
  }
})

// 项目page.mpx
{
  "usingComponents": {
    "mpx-button": "~mpx-ui/src/components/button", // npm 包路径
    "component-tag-name": "path/to/the/custom/component" // 内部组件路径
  }
}
```
