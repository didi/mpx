# @mpxjs/cli 插件化改造

[@mxpjs/cli 地址](https://github.com/mpx-ecology/mpx-cli)

## 背景 & 现状

Mpx 脚手架 `@mpxjs/cli` 作为 Mpx 生态当中比较重要的一部分，是使用 Mpx 进行小程序开发的入口。

`@mpxjs/cli@2.x` 版本整体是基于模板配置的方式完成项目的初始化，整个的工作流是：

1. 下载一份存放于远端的 mpx 项目原始模板（mpx-template）

2. 根据用户的 prompts 选项完成用户选项的注入，并初始化最终的项目文件

完成项目的初始化后，除了一些基础配置文件外，整个项目的文件主要包含了如下的结构：

```javascript
-- mpx-project
 |-- src // 项目源码
 |-- config // 项目配置文件
   |-- index.js // 配置入口文件
   |-- mpxLoader.conf.js // mpx-loader 配置
   |-- mpxPlugin.conf.js // mpx webpack-plugin 配置
   |-- user.conf.js // 用户的 prompts 选择信息
 |-- build // 编译构建配置
   |-- build.js // 构建编译脚本
   |-- getPlugins.js // webpack plugins 
   |-- getRules.js // webpack module rules
   |-- getWebpackConf.js // webpack 配置生成辅助函数
   |-- utils.js // 工具函数
   |-- webpack.base.conf.js // webpack 基础配置
```

在初始化的项目当中，有关项目的所有配置文件，编译构建代码是全部暴露给开发者的，开发者可以对这些文件进行修改来满足自己实际的项目开发需要。同时还可以基于这一套原始的模板文件二次拓展为满足自己业务场景的模板。

**基于远程模板初始化项目的方式最大的一个好处就是将项目所有的底层配置完全暴露给开发者，开发者可以任意去修改对应的配置。**

## `mpxjs/cli@2.x` 自身的痛点

目前 `@mpxjs/cli@2.x` 采用这种基于模板的方式面临着两方面的痛点：

1. 对于 `@mpxjs/cli` 的使用者而言：

* 模板和业务项目割裂：远程模板没有严格的版本控制，用户无法感知到远程模板的更新变化；
* 项目升级困难：对于用户来说没有一个很好的方式完成升级工作，基本只能通过 copy 代码的方式，将 `mpx-template` 更新后的内容复制一份到自己的项目当中；或者是通过脚手架重新创建一个新的项目，将老的代码迁移到新项目当中；
* 项目结构臃肿：从项目结构角度来说没法做到按需，初始化代码臃肿。Mpx 支持了小程序跨平台、跨端、小程序插件等等相关的开发，不同的编译构建配置都需要全部生成，在运行时阶段才能决定是否启动对应的功能；

* 跨 Web 构建能力弱：在基于 Mpx 的跨 Web 场景构建中有关 `web` 侧的编译构建的配置是比较初级的，像 `MPA 多页应用` 等比较常用的功能是需要用户重新去手动搭建一套的；
* 可拓展性差，基于目前的模板拉取的方式无法满足多样化的业务需求场景迭代；

2. 对于 `@mpxjs/cli` 的开发者而言：

* 分支场景多，功能模块耦合度高：脚手架的所有功能全部集合到一个大的模板当中。各部分的能力都是耦合在一起，为了满足不同项目的实际开发需要，代码里面需要写比较多的 `if...else...` 判断逻辑来决定要开启哪些功能，生成哪部分的模板；
* 长期可维护性差，开发心智负担重；

**针对以上问题，通过调研业内一些优秀的脚手架工具，发现 `@vue/cli` 插件化的架构设计能很好的去解决我们以上所遇到的问题。核心思路是将 `@vue/cli` 作为 `@mpxjs/cli` 底层的引擎，收敛 Mpx 对于核心依赖管理、模板、构建配置的能力，充分利用 `@vue/cli` 提供的插件机制去构建、拓展上层的插件集。**

### 有关 `@vue/cli`

简单介绍下 `@vue/cli` 的插件化架构：

`@vue/cli@3.x` 相较于 `2.x` 版本相比，整个 `@vue/cli` 的架构发生了非常大的变化，从基于模板的脚手架迭代为基于插件化的脚手架。简单的概述下整个插件化的构架就是：

![mpx-cli-3](https://dpubstatic.udache.com/static/dpubimg/zfUXzzdOptIviAJ15AgSn_cli-3.png)

* @vue/cli 提供 vue cli 命令，负责偏好设置，生成模板、`vue-cli-plugin` 插件依赖管理的工作，例如 `vue create <projectName>`、`vue add <pluginName>`；

* @vue/cli-service 作为 @vue/cli 整个插件系统当中的内部核心插件，提供了 npm script 注册服务，内置了部分 webpack 配置的同时，又提供了 `vue-cli-plugin` 插件的导入、加载以及 webpack 配置更新服务等。

以上是 `@vue/cli` 生态当中最为核心的两部分内容，二者分工明确，各司其职。

此外在 `@vue/cli` 生态当中非常重要的一个点就是 `vue-cli-plugin` 插件，每个插件主要完成模板生成及生产编译构建配置。根据 `@vue/cli` 设计的规范，开发一个 `vue-cli-plugin` 需要遵照**相关的约定**来进行开发：

* @vue/cli **约定**插件如果要生成模板，那么需要提供 `generator` 入口文件；

* @vue/cli-service **约定**插件的 `webpack` 配置更新需要放到插件的入口文件当中来完成，同时插件的命名也需要包含 `vue-cli-plugin` 前缀，因为 @vue/cli-service 是依据命名来加载相关的插件的；


## 插件化改造方案

一张图了解下插件化改造之后的 `@mpxjs/cli` 的架构设计：

![mpx-cli-2](https://dpubstatic.udache.com/static/dpubimg/hNaL_GUMzUVLOsyY5quGE_cli-2.png)

### 底层能力

将 `@vue/cli`、`@vue/cli-service` 分别作为 `@mpx/cli`和 `@mpx/cli-service` 的底层能力，即利用插件化的架构设计，同时还非常灵活的满足了 Mpx 做差异化场景迭代的定制化改造。上层的插件满足 `vue-cli-plugin` 插件开发的规范，最终底层的能力还是依托于 `@vue/cli` 和 `@vue/cli-service` 进行工作。

### 上层插件拆分

将原本大而全的模板进行插件化拆分，从 Mpx 所要解决的问题以及设计思路来考虑，站在跨平台的角度：

1. web 开发

* 基于 `wx` 的跨 `web` 开发；

2. 小程序开发

* 基于 `wx` 的跨平台(`ali`、`swan`，`tt`，`dd`)的小程序开发；
* 使用云函数的微信小程序开发；
* 微信小程序的插件模式的开发；

一个项目可能只需要某一种开发模式，例如仅仅是微信小程序的插件模式开发，也有可能是小程序和web平台混合开发等等，不同的开发模式对应了：

1. **不同的目录结构**；

2. **不同的编译构建配置**

---

基于这样一种现状以及 `@mpxjs/cli` 所要解决的问题，从跨平台的角度出发将功能进行了拆分，最终拆解为如下的9个插件：

* [vue-cli-plugin-mpx](https://github.com/mpx-ecology/mpx-cli/tree/master/packages/vue-cli-plugin-mpx)（mpx 基础开发插件）

* [vue-cli-plugin-mpx-mp](https://github.com/mpx-ecology/mpx-cli/tree/master/packages/vue-cli-plugin-mpx-mp)（mpx 小程序平台开发插件）

* [vue-cli-plugin-mpx-web](https://github.com/mpx-ecology/mpx-cli/tree/master/packages/vue-cli-plugin-mpx-web)（mpx 跨 web 平台开发插件）

* [vue-cli-plugin-mpx-cloud-func](https://github.com/mpx-ecology/mpx-cli/tree/master/packages/vue-cli-plugin-mpx-cloud-func)（微信小程序云函数开发插件）

* [vue-cli-plugin-mpx-plugin-mode](https://github.com/mpx-ecology/mpx-cli/tree/master/packages/vue-cli-plugin-mpx-plugin-mode)（微信小程序插件模式开发插件）

* [vue-cli-plugin-mpx-eslint](https://github.com/mpx-ecology/mpx-cli/tree/master/packages/vue-cli-plugin-mpx-eslint)（mpx eslint 插件）

* [vue-cli-plugin-mpx-unit-test](https://github.com/mpx-ecology/mpx-cli/tree/master/packages/vue-cli-plugin-mpx-unit-test)（小程序单元测试插件）

* [vue-cli-plugin-mpx-typescript](https://github.com/mpx-ecology/mpx-cli/tree/master/packages/vue-cli-plugin-mpx-typescript)（mpx typescript 插件）

这些拆解出来的插件都将和功能相关的**项目模板**以及**编译构建**配置进行了收敛。

项目模板的生成不用说，借助 `@vue/cli` 的 `Generator API` 按需去生成项目开发所需要的模板，例如项目需要使用 `eslint` 的功能，那么在生成项目的时候会生成对应 `vue-cli-plugin-mpx-eslint` 所提供的模板文件，如果不需要使用，项目当中最终也不会出现和 `eslint` 相关的文件配置。

重点说下编译构建的配置是如何进行拆解的：

**在 `@vue/cli@3.x` 基于插件的架构设计当中，决定是否要使用某个插件的依据就是判断这个插件是否被你的项目所安装**和基于模板的构架相比最大的区别就是：基于模板的架构在最终生成的模板配置里需要保存一些环境配置文件，以供编译构建的运行时来判断是否启用某些功能。但是基于插件的架构基本上是不再需要这些环境配置文件的，因为你如果要使用一个插件的功能，只需要安装它即可。

因此依照这样的设计规范，我们将：

* `eslint`

* `unit-test`

* `typescript`

这些非常独立的功能都单独抽离成了可拔插的插件，安装即启用。

以上功能有个特点就是和平台是完全解耦的，所以在拆解的过程中可以拆的比较彻底。但是由于 `mpx` 项目的特殊性，即要支持基于 `wx` 小程序的跨端以及 `web` 开发，同时还要支持小程序的云函数、小程序插件模式的开发，且不同开发模式的编译构建配置都有些差异。可以用如下的集合图来表示他们之间的关系：

![mpx-cli-4](https://dpubstatic.udache.com/static/dpubimg/3bgI4GSZ09ai4G1C3TDtr_cli-4.png)

不同插件进行组合使用来满足不同场景下的使用。

在不同平台开发模式下是有 `mpx` 编译构建的基础配置的，这个是和平台没有太多关系，因此将这部分的配置单独抽离为一个插件：`vue-cli-plugin-mpx`，**同时这个插件也被置为了 `@mpxjs/cli` 的 `preset` 预设插件，不管任何项目开发模式下，这个插件都会被默认的安装**。

```javascript
// vue-cli-plugin-mpx
module.exports = function (api, options, webpackConfig) {
  webpackConfig.module
    .rule('json')
    .test(/\.json$/)
    .resourceQuery(/asScript/)
    .type('javascript/auto')

  webpackConfig.module
    .rule('wxs-pre-loader')
    .test(/\.(wxs|qs|sjs|filter\.js)$/)
    .pre()
    .use('mpx-wxs-pre-loader')
    .loader(MpxWebpackPlugin.wxsPreLoader().loader)

  const transpileDepRegex = genTranspileDepRegex(options.transpileDependencies || [])
  webpackConfig.module
    .rule('js')
    .test(/\.js$/)
    .include
    .add(filepath => transpileDepRegex && transpileDepRegex.test(filepath))
    .add(filepath => /\.mpx\.js/.test(filepath)) // 处理 mpx 转 web 的情况，vue-loader 会将 script block fake 出一个 .mpx.js 路径，用以 loader 的匹配
    .add(api.resolve('src'))
    .add(api.resolve('node_modules/@mpxjs'))
    .add(api.resolve('test'))
    .end()
    .use('babel-loader')
    .loader('babel-loader')

  const transpileDepRegex = genTranspileDepRegex(options.transpileDependencies)
  webpackConfig.module
    .rule('js')
    .test(/\.js$/)
    .include
      .add(filepath => transpileDepRegex && transpileDepRegex.test(filepath))
      .add(api.resolve('src'))
      .add(api.resolve('node_modules/@mpxjs'))
      .add(api.resolve('test'))
        .end()
    .use('babel-loader')
      .loader('babel-loader')

  webpackConfig.resolve.extensions
    .add('.mpx')
    .add('.wxml')
    .add('.ts')
    .add('.js')

  webpackConfig.resolve.modules.add('node_modules')
}
```

在小程序的开发模式下，`vue-cli-plugin-mpx-mp` 会在 `vue-cli-plugin-mpx` 的基础上去拓展 `webpack` 配置以满足小程序的编译构建。

在跨 web 的开发模式下，`vue-cli-plugin-mpx-web` 会在 `vue-cli-plugin-mpx` 和 `@vue/cli` 的基础上去拓展配置以满足 web 侧的开发编译构建。

### Web 平台编译构建能力增强

在 `@mpxjs/cli@2.x` 版本当中有关 `web` 侧的编译构建的配置是比较初级的，像 `热更新`、`MPA 多页应用` 等比较常用的功能是需要用户重新去手动搭建一套的。而 `@vue/cli@3.x` 即为 `vue` 项目而生，提供了非常完备的 `web` 应用的编译构建打包配置。

**所以 `@mpxjs/cli@next` 版本里面做了一项非常重要的工作就是复用 `@vue/cli` 的能力，弥补 `mpx` 项目在跨 `web` 项目编译构建的不足。**

因此关于 `mpx` 跨 `web` 编译构建的部分也单独抽离为一个插件：`vue-cli-plugin-mpx-web`，这个插件所做的工作就是在 `@vue/cli` 提供的 `web` 编译构建的能力上去适配 `mpx` 项目。这样也就完成了 `mpx` 跨 `web` 项目编译构建能力的增强。

**这也意味着 `@vue/cli` 所提供的能力基本上在 mpx 跨 web 项目当中都可使用。**

### 项目配置拓展能力

在 `@mpxjs/cli@2.x` 版本的项目如果要进行配置拓展，基本需要进行以下2个步骤：

1. 对 `config` 文件夹下的相关的配置文件进行修改；

2. 对 `build` 文件夹下的编译构建配置文件进行修改；

这也是在文章一开始的时候就提到的基于模板的大而全的文件组织方式。

而在 `@mpxjs/cli@next` 版本当中，将项目的配置拓展全部收敛至 `vue.config.js` 文件当中去完成，同时减少了开发者需要了解项目结构的心智负担。

```javascript
// vue.config.js

module.exports = {
  pluginOptions: {
    mpx: {
      plugin: {
        // mpx-plugin 相关的配置
      },
      loader: {
        // mpx-loader 相关的配置
      }
    }
  },
  configureWebpack() {},
  chainWebpack() {
    // 自定义的 webpack 配置
  }
}
```

### 改造后的目录结构

在第一章节展示了目前 `@mpxjs/cli@2.x` 初始化项目的结构和现状。经过这次的插件化的改造后，项目的结构变得更为简洁，开发者只需要关注 `src` 源码目录以及 `vue.config.js` 配置文件即可：

```javascript
-- mpx-project
 |--src
 |--vue.config.js 
```

## 没有银弹

虽然基于 `@vue/cli` 插件的架构模式完成了 `@mpxjs/cli@3.x` 的插件化改造升级。但是由于 `mpx` 项目开发的一些特殊性，不同插件之间的协同工作是有一些约定的。

例如 `@vue/cli-service` 内置了一些 `webpack` 的配置，因为 `@vue/cli` 是专门针对 `web`应用的，这些配置会在所有的编译构建流程当中生效，不过这些配置当中有些对于小程序的开发来说是不需要的。

那么针对这种情况，为了避免不同模式下的 `webpack` 配置相互污染。`web` 侧的编译构建还是基于 `@vue/cli` 提供的能力去适配 `mpx` 的 `web` 开发。而小程序侧的编译构建配置是通过 `@vue/cli-service` 内部暴露出来的一些方法去跳过一些对于小程序开发来说不需要的 `webpack` 配置来最终满足小程序的构建配置。

因此在各插件的开发当中，需要暴露该插件所应用的平台：

```javascript
module.export.platform = 'mp'  // 可选值： 'web'
```

这样在实际的构建过程当中通过平台的标识来决定对应哪些插件会生效。

## 如何开发一个基于 mpx 的业务脚手架插件

具体参阅[文档](https://github.com/mpx-ecology/mpx-cli/blob/master/PLUGIN_GUIDE.md)
