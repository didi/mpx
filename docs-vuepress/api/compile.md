---
sidebarDepth: 2
---

# 编译构建

对于使用 `@mpxjs/cli@3.x` 脚手架初始化的项目而言，编译构建相关的配置统一收敛至项目根目录下的 `vue.config.js` 进行配置。一个新项目初始化的 `vue.config.js` 如下图，相较于 `@mpxjs/cli@2.x` 版本，在新的初始化项目当中原有的编译构建配置都收敛至 cli 插件当中进行管理和维护，同时还对外暴露相关的接口或者 api 使得开发者能自定义修改 cli 插件当中默认的配置。

```javascript
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        // mpx webpack plugin options
      },
      unocss: {
        // @mpxjs/unocss-plugin 相关的配置
      }
    }
  }
})
```

对于使用 `@mpxjs/cli@2.x` 脚手架初始化的项目，编译构建配置涉及到 mpx 插件相关的配置主要是在 `config` 目录下 `mpxPlugin.conf.js`，涉及到 webpack 本身的配置主要是在 `build` 目录下。

```javascript
// config/mpxPlugin.conf.js
module.exports = () => {
  return {
    // mpx webpack plugin options
  }
}
```

## 类型定义

为了便于对编译配置的数据类型进行准确地描述，我们在这里对一些常用的配置类型进行定义

### Rules
```ts
type Condition = string | ((resourcePath: string) => boolean) | RegExp

interface Rules {
  include?: Condition | Array<Condition>
  exclude?: Condition | Array<Condition>
}
```

## MpxWebpackPlugin 

Mpx 编译构建跨平台小程序和 web 的 webpack 主插件，安装示例如下：

```bash 
npm install -D @mpxjs/webpack-plugin
pnpm install -D @mpxjs/webpack-plugin
yarn add -D @mpxjs/webpack-plugin
```

使用示例如下：
```javascript
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        // mpx webpack plugin options
      }
    }
  }
})
```

MpxWebpackPlugin支持传入以下配置：

### mode

`'wx' | 'ali' | 'swan' | 'qq' | 'tt' | 'jd' | 'dd' | 'qa' | 'web' = 'wx'`

mode 为 Mpx 编译的目标平台， 目前支持的有微信小程序(wx)\支付宝小程序(ali)\百度小程序(swan)\头条小程序(tt)\QQ 小程序(qq)\京东小程序(jd)\滴滴小程序(dd)\快应用(qa)\H5 页面(web)。

::: tip
在 @mpxjs/cli@3.x 版本当中，通过在 `npm script` 当中定义 `targets` 来设置目标平台

```javascript
// 项目 package.json
{
  "script": {
    "build:cross": "mpx-cli-service build:mp --targets=wx,ali"
  }
}
```
:::

### srcMode

`'wx' | 'ali' | 'swan' | 'qq' | 'tt' | 'jd' | 'dd' | 'qa' = 'wx'`

默认和 [mode](#mode) 一致。，当 srcMode 和 mode 不一致时，会读取相应的配置对项目进行编译和运行时的转换。

```javascript
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        srcMode: 'wx' // 根据项目初始化所选平台来设定
      }
    }
  }
})
```

::: warning
暂时只支持微信为源 mode 做跨平台，为其他时，mode 必须和 srcMode 保持一致。
:::

### modeRules

`{ [key: string]: Rules }`

批量指定文件mode，用于条件编译场景下使用某些单小程序平台的库时批量标记这些文件的mode为对应平台，而不再走转换规则。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        modeRules: {
          ali: {
            include: [resolve('node_modules/vant-aliapp')]
          }
        }
      }
    }
  }
})
```

### externalClasses

`Array<string>`

定义若干个外部样式类，这些将会覆盖元素原有的样式。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        externalClasses: ['custom-class', 'i-class']
      }
    }
  }
})
```

::: warning
抹平支付宝和微信之间的差异，当使用了微信 **externalClasses** 语法时，跨端输出需要在 @mpxjs/webpack-plugin 的配置中添加此配置来辅助框架进行转换。
:::

### resolveMode

`'webpack' | 'native' = 'webpack'`

指定resolveMode，默认webpack，更便于引入npm包中的页面/组件等资源。若想编写时和原生保持一致或兼容已有原生项目，可设为native，此时需要提供[projectRoot](#projectroot)以指定项目根目录，且使用npm资源时需在前面加`~`。

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

### projectRoot

`string`

当resolveMode为native时需通过该字段指定项目根目录。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
         resolveMode: 'native',
         projectRoot: path.resolve(__dirname, '../src')
      }
    }
  }
})
```

### writeMode

`'full' | 'change' = 'change'`

webpack 的输出默认是全量输出，而小程序开发者工具不关心文件是否真正发生了变化。设置为 change 时，Mpx 在 watch 模式下将内部 diff 一次，只会对内容发生变化的文件进行写入，以提升小程序开发者工具编译性能。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
         writeMode: 'change'
      }
    }
  }
})
```

### autoScopeRules

[`Rules`](#rules)

是否需要对样式加 scope ，目前只有支付宝小程序平台没有样式隔离，因此该部分内容也只对支付宝小程序平台生效。提供 include 和 exclude 以精确控制对哪些文件进行样式隔离，哪些不隔离，和webpack的rules规则相同。也可以通过在 style 代码块上声明 scoped 进行。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
         autoScopeRules: {
           include: [resolve('../src')],
           exclude: [resolve('../node_modules/vant-aliapp')] // 比如一些组件库本来就是为支付宝小程序编写的，应该已经考虑过样式隔离，就不需要再添加
         }
      }
    }
  }
})
```

### forceDisableProxyCtor

`boolean = false`

用于控制在跨平台输出时对实例构造函数（`App` | `Page` | `Component` | `Behavior`）进行代理替换以抹平平台差异。当配置 `forceDisableProxyCtor` 为 true 时，会强行取消平台差异抹平逻辑，开发时需针对输出到不同平台进行条件判断。

### transMpxRules

[`Rules`](#rules)

是否转换 wx / my 等全局对象为 Mpx 对象，

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        transMpxRules: {
          include: () => true,
          exclude: ['@mpxjs']
        }
      }
    }
  }
})
```

### forceProxyEventRules

[`Rules`](#rules)

强制代理规则内配置的事件。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        forceProxyEventRules: {
          include: ['bindtap']
        }
      }
    }
  }
})
```

### defs

`object`

给模板、js、json、style中定义一些全局常量。一般用于区分平台/环境。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        defs: {
          __env__: 'mini'
        }
      }
    }
  }
})
```

在模板中使用：

```html
<template>
  <view>{{__env__}}</view>
</template>
```

在js中使用：

```js
const env = __env__;
```

在style中使用：

```js
/* @mpx-if (__env__ === 'mini') */
.color {
  background: red;
}
/* @mpx-endif */
```

在json中使用：

```js
<script name='json'>
  module.exports = {
    "component": true,
    "usingComponents": {
      "a": __env__
    }
  }
</script>
```

> 注意：这里定义之后使用的时候是按照全局变量来使用，而非按照`process.env.KEY`这样的形式

### attributes

`Array<string> = ['image:src', 'audio:src', 'video:src', 'cover-image:src', 'import:src', 'include:src']`

`Mpx` 提供了可以给自定义标签设置资源的功能，配置该属性后，即可在目标标签中使用 `:src` 加载相应资源文件

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        attributes: ['customTag:src']
      }
    }
  }
})
```

```html
<customTag :src="'https://www....../avator.png'"></customTag>
```
:::tip
该属性可通过 `MpxWebpackPlugin` 配置，也可以通过配置 `WxmlLoader`，后者优先级高。
:::

### externals

`Array<string>`

目前仅支持微信小程序 weui 组件库通过 useExtendedLib 扩展库的方式引入，这种方式引入的组件将不会计入代码包大小。配置 externals 选项，Mpx 将不会解析 weui 组件的路径并打包。

``` javascript
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        externals: ['weui']
      }
    }
  }
})
```

``` html
<script name="json">
  // app.mpx json部分
  module.exports = {
    "useExtendedLib": {
      "weui": true
    }
  }
</script>
```

``` html
<!-- 在 page 中使用 weui 组件 -->
<template>
  <view wx:if="{{__mpx_mode__ === 'wx'}}">
    <mp-icon icon="play" color="black" size="{{25}}" bindtap="showDialog"></mp-icon>
    <mp-dialog title="test" show="{{dialogShow}}" bindbuttontap="tapDialogButton" buttons="{{buttons}}">
      <view>test content</view>
    </mp-dialog>
  </view>
</template>

<script>
  import{ createPage } from '@mpxjs/core'

  createPage({
    data: {
      dialogShow: false,
      showOneButtonDialog: false,
      buttons: [{text: '取消'}, {text: '确定'}],
    },
    methods: {
      tapDialogButton () {
        this.dialogShow = false
        this.showOneButtonDialog = false
      },
      showDialog () {
        this.dialogShow = true
      }
    }
  })
</script>

<script name="json">
  const wxComponents = {
    "mp-icon": "weui-miniprogram/icon/icon",
    "mp-dialog": "weui-miniprogram/dialog/dialog"
  }
  module.exports = {
    "usingComponents": __mpx_mode__ === 'wx'
      ? Object.assign({}, wxComponents)
      : {}
  }
</script>
```

**参考**：<a href="https://developers.weixin.qq.com/miniprogram/dev/extended/weui/quickstart.html" target="_blank">weui组件库</a>

### miniNpmPackage

`Array<string>`

微信小程序官方提供了[发布小程序 npm 包的约束](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html)。
部分小程序npm包，如[vant组件库](https://vant-contrib.gitee.io/vant-weapp/#/quickstart)官方文档使用说明，引用资源并不会包含miniprogram所指定的目录
如 "@vant/weapp/button/index"，导致 `Mpx` 解析路径失败。
`Mpx`为解决这个问题，提供miniNpmPackage字段供用户配置需要解析的小程序npm包。miniNpmPackage对应的数组值为npm包对应的package.json中的name字段。
`Mpx`解析规则如下:
  1. 如package.json中有miniprogram字段，则会默认拼接miniprogram对应的值到资源路径中
  2. 如package.json中无miniprogram字段，但配置了miniNpmPackage，则默认会拼接miniprogram_dist目录

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        miniNpmPackage: ['@vant/weapp']
      }
    }
  }
})
```

### forceUsePageCtor

`Boolean = false`

为了获取更丰富的生命周期来进行更加完善的增强处理，在非支付宝小程序环境下，`Mpx` 默认会使用 `Conponent` 构造器来创建页面。将该值设置为 `true` 时，会强制使用 `Page` 构造器创建页面。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        forceUsePageCtor: true
      }
    }
  }
})
```

### transRpxRules

`Array<object> | object`
  - `option.mode` 可选值有 none/only/all，分别是不启用/只对注释内容启用/只对非注释内容启用
  - `option.designWidth` 设计稿宽度，默认值就是750，可根据需要修改
  - `option.include` 同webpack的include规则
  - `option.exclude` 同webpack的exclude规则
  - `option.comment` rpx注释，建议使用 'use px'/'use rpx'，当 mode 为 all 时默认值为 use px，mode 为 only 时默认值为 'use rpx'

为了处理某些IDE中不支持`rpx`单位的问题，Mpx 提供了一个将 px 转换为 rpx 的功能。支持通过注释控制行级、块级的是否转换，支持局部使用，支持不同依赖分别使用不用的转换规则等灵活的能力。`transRpxRules`可以是一个对象，也可以是多个这种对象组成的数组。

```js
// vue.config.js
const path = require('path')

module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        transRpxRules: [
          {
            mode: 'only', // 只对注释为'use rpx'的块儿启用转换rpx
            comment: 'use rpx', // mode为'only'时，默认值为'use rpx'
            include: path.resolve('src'),
            exclude: path.resolve('lib'),
            designWidth: 750
          },
          {
            mode: 'all', // 所有样式都启用转换rpx，除了注释为'use px'的样式不转换
            comment: 'use px', // mode为'all'时，默认值为'use px'
            include: path.resolve('node_modules/@didi/mpx-sec-guard')
          }
        ]
      }
    }
  }
})
```

#### 应用场景及相应配置

接下来我们来看下一些应用场景及如何配置。如果是用脚手架生成的项目，在`mpx.plugin.conf.js`里找到`transRpxRules`，应该已经有预设的`transRpxRules`选项，按例修改即可。

三种场景分别是 [普通使用](#场景一) ， [只对某些特殊样式转换](#场景二) ， [不同路径分别配置规则](#场景三)

#### 场景一
设计师给的稿是2倍图，分辨率750px。或者更高倍图。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        transRpxRules: [{
          mode: 'all',
          designWidth: 750 // 如果是其他倍，修改此值为设计稿的宽度即可
        }]
      }
    }
  }
})
```

#### 场景二

大部分样式都用px下，某些元素期望用rpx。或者反过来。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        transRpxRules: [{
          mode: 'only',
          comment: 'use rpx',
          designWidth: 750 // 设计稿宽度
        }]
      }
    }
  }
})
```

mpx的rpx注释能帮助你仅为部分类或者部分样式启用rpx转换，细节请看下方附录。

#### 场景三
使用了第三方组件，它的设计宽度和主项目不一致，期望能设置不同的转换规则

```js
// vue.config.js
const path = require('path')

module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        transRpxRules: [
          {
            mode: 'only',
            designWidth: 750,
            comment: 'use rpx',
            include: resolve('src')
          },
          {
            mode: 'all',
            designWidth: 1280, // 对iview单独使用一个不同的designWidth
            include: path.resolve('node_modules/iview-weapp')
          }
        ]
      }
    }
  }
})
```

> 注意事项：转换规则是不可以对一个文件做多次转换的，会出错，所以一旦被一个规则命中后就不会再次命中另一个规则，include 和 exclude 的编写需要注意先后顺序，就比如上面这个配置，如果第一个规则 include 的是 '/' 即整个项目，iview-weapp 里的样式就无法命中第二条规则了。

#### transRpxRules附录

- **designWidth**

设计稿宽度，单位为`px`。默认值为`750px`。

`mpx`会基于小程序标准的屏幕宽度`baseWidth 750rpx`，与`option.designWidth`计算出一个转换比例`transRatio`。

转换比例的计算方式为`transRatio = (baseWidth / designWidth)`，精度为小数点后2位四舍五入。

所有生效的`rpx注释样式`中的px会乘上`transRatio`得出最终的 rpx 值。

例如：

```css
/* 转换前：designWidth = 1280 */
.btn {
  width: 200px;
  height: 100px;
}

/* 转换后: transRatio = 0.59 */
.btn {
  width: 118rpx;
  height: 59rpx;
}
```

- **comment: rpx 注释样式**

根据`rpx注释`的位置，`mpx`会将`一段css规则`或者`一条css声明`视为`rpx注释样式`。

开发者可以声明一段 rpx 注释样式，提示编译器是否转换这段 css 中的 px。

例如：
```html
<style lang="css">
  /* use rpx */
  .not-translate-a {
    font-size: 100px;
    padding: 10px;
  }
  .not-translate-b {
    /* use rpx */
    font-size: 100px;
    padding: 10px;
  }
  .translate-a {
    font-size: 100px;
    padding: 10px;
  }
  .translate-b {
    font-size: 100px;
    padding: 10px;
  }
</style>
```
> 第一个注释位于一个`选择器`前，是一个`css规则注释`，整个规则都会被视为`rpx注释样式`

> 第二个注释位于一个`css声明`前，是一个`css声明注释`，只有`font-size: 100px`会被视为`rpx注释样式`

> `transRpx = only`模式下，只有两部分`rpx注释样式`会转rpx。

### postcssInlineConfig

`{options? : PostcssOptions, plugins? : PostcssPlugin[], mpxPrePlugins? : PostcssPlugin[], ignoreConfigFile : Boolean}`

使用类似于 postcss.config.js 的语法书写 postcss 的配置文件。用于定义 Mpx 对于组件/页面样式进行 postcss 处理时的配置， ignoreConfigFile 传递为 true 时会忽略项目中的 postcss 配置文件 。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        postcssInlineConfig: {
          plugins: [
            // require('postcss-import'),
            // require('postcss-preset-env'),
            // require('cssnano'),
            // require('autoprefixer')
          ]
        }
      }
    }
  }
})
```

**注意**：默认添加的 postcss 插件均会在`mpx的内置插件`（例如如rpx插件等）之后处理。如需使配置的插件优先于内置插件，可以在 `postcssInlineConfig` 中添加 `mpxPrePlugins` 配置：

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        postcssInlineConfig: {
          plugins: [
            require('postcss-import'),
            require('postcss-preset-env'),
          ],
          mpxPrePlugins: [
            require('cssnano'),
            require('autoprefixer')
          ]
          // 以下写法同理
          // mpxPrePlugins: {
          //   'cssnano': {},
          //   'autoprefixer': {}
          // }
        }
      }
    }
  }
})
```

`postcss.config.js` 中配置同理：

```js
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-preset-env'),
  ],
  mpxPrePlugins: [
    require('cssnano'),
    require('autoprefixer')
  ]
}

```

在上面这个例子当中，postcss 插件处理的最终顺序为：`cssnano` -> `autoprefixer` -> `mpx内置插件` -> `postcss-import` -> `postcss-preset-env`

::: warning
注意：在 `mpxPrePlugins` 中配置的 postcss 插件如果不通过 mpx 进行处理，那么将不会生效。
:::

### decodeHTMLText

`boolean = false`

设置为 true 时在模板编译时对模板中的 text 内容进行 decode

### nativeConfig

`{cssLangs: string[]}`

为原生多文件写法添加css预处理语言支持，用于优先搜索预编译器后缀的文件，按 cssLangs 中的声明顺序查找。默认按照 css , less , stylus ,  scss , sass 的顺序

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        nativeConfig: {
          cssLangs: ['css', 'less', 'stylus', 'scss', 'sass']
        }
      }
    }
  }
})
```

### webConfig

`{transRpxFn(match:string, $1:number): string}`

transRpxFn 配置用于自定义输出 web 时对于 rpx 样式单位的转换逻辑，常见的方式有转换为 vw 或转换为 rem

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        webConfig: {
          transRpxFn: function (match, $1) {
            if ($1 === '0') return $1
            return `${$1 * +(100 / 750).toFixed(8)}vw`
          }
        }
      }
    }
  }
})
```

### i18n

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        i18n: {
          locale: 'en-US',
          messages: {
            'en-US': {
              message: {
                hello: '{msg} world'
              }
            },
            'zh-CN': {
              message: {
                hello: '{msg} 世界'
              }
            }
          },
          // messagesPath: path.resolve(__dirname, '../src/i18n.js')
        }
      }
    }
  }
})
```

Mpx 支持国际化，底层实现依赖类`wxs`能力，通过指定语言标识和语言包，可实现多语言之间的动态切换。可配置项包括locale、messages、messagesPath。

#### i18n.locale

`string`

通过配置 locale 属性，可指定语言标识，默认值为 'zh-CN'

#### i18n.messages

`object`

通过配置 messages 属性，可以指定项目语言包，Mpx 会依据语言包对象定义进行转换，示例如下：
```js
messages: {
  'en-US': {
    message: {
      'title': 'DiDi Chuxing',
      'subTitle': 'Make travel better'
    }
  },
  'zh-CN': {
    message: {
      'title': '滴滴出行',
      'subTitle': '让出行更美好'
    }
  }
}
```

#### i18n.messagesPath

`string`

为便于开发，Mpx 还支持配置语言包资源路径 messagesPath 来代替 messages 属性，Mpx 会从该路径下的 js 文件导出语言包对象。如果同时配置 messages 和 messagesPath 属性，Mpx 会优先设定 messages 为 i18n 语言包资源。

详细介绍及使用见[工具-国际化i18n](../guide/tool/i18n.md)一节。

### auditResource

`'component' | boolean = false`

检查资源输出情况，如果置为true，则会提示有哪些资源被同时输出到了多个分包，可以检查是否应该放进主包以消减体积，设置为 `'component'` 的话，则只检查组件资源是否被输出到多个分包。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        auditResource: true
      }
    }
  }
})
```

### subpackageModulesRules

`object`

是否将多分包共用的模块分别输出到各自分包中，匹配规则为include匹配到且未被exclude匹配到的资源

依据微信小程序的分包策略，多个分包使用到的 js 模块会打入主包当中，但在大型分包较多的项目中，该策略极易将大量的模块打入主包，从而使主包体积大小超出2M限制，该配置项提供给开发者自主抉择，可将部分模块冗余输出至多个分包，从而控制主包体积不超限

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        subpackageModulesRules: {
          include: ['@someNpm/name/src/api/*.js'],
          exclude: ['@someNpm/name/src/api/module.js']
        }
      }
    }
  }
})
```
> tips: 该功能是将模块分别放入多个分包，模块状态不可复用，使用前要依据模块功能做好评估，例如全局store就不适用该功能

### generateBuildMap

`boolean = false`

是否生成构建结果与源码之间的映射文件。用于单元测试等场景。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        generateBuildMap: true
      }
    }
  }
})
```

**参考**：[单元测试](../guide/tool/unit-test.md)

### autoVirtualHostRules

[`Rules`](#rules)
批量配置是否虚拟化组件节点，对应微信中[`VirtualHost`](https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/wxml-wxss.html) 。默认不开启，开启后也将抹平支付宝小程序中的表现差异。提供 include 和 exclude 以精确控制对哪些文件开启VirtualHost，哪些不开启。和webpack的rules规则相同。

默认情况下，自定义组件本身的那个节点是一个“普通”的节点，使用时可以在这个节点上设置 `class` 、`style` 、动画、 flex 布局等，就如同普通的 view 组件节点一样。但有些时候，自定义组件并不希望这个节点本身可以设置样式、响应 flex 布局等，而是希望自定义组件内部的第一层节点能够响应 flex 布局或者样式由自定义组件本身完全决定。这种情况下，可以将这个自定义组件设置为“虚拟的”。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        autoVirtualHostRules: {
          include: [resolve('../src')],
          exclude: [resolve('../components/other')]
        }
      }
    }
  }
})
```

### partialCompile

`{ include: string | RegExp | Function | Array<string | RegExp | Function> }`

在大型的小程序开发当中，全量打包页面耗时非常长，往往在`开发过程`中仅仅只需用到几个 pages 而已，该配置项支持打包指定的小程序页面。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        // include 可以是正则、字符串、函数、数组
        partialCompile: {
          include: '/project/pages', // 文件路径包含 '/project/pages' 的页面都会被打包
          include: /pages\/internal/, // 文件路径能与正则匹配上的页面都会被打包
          include (pageResourcePath) {
            // pageResourcePath 是小程序页面所在系统的文件路径
            return pageResourcePath.includes('pages') // 文件路径包含 'pages' 的页面都会被打包
          },
          include: [
            '/project/pages',
            /pages\/internal/,
            (pageResourcePath) => pageResourcePath.includes('pages')
          ] // 满足任意条件的页面都会被打包
        }
      }
    }
  }
})
```

:::warning
该特性只能用于**开发环境**，默认情况下会阻止所有页面(**入口 app.mpx 除外**)的打包。
:::

### optimizeRenderRules

[`Rules`](#rules)

render 函数中可能会存在一些重复变量，该配置可消除 render 函数中的重复变量，进而减少包体积。不配置该参数，则不会消除重复变量。

同时框架 render 函数优化提供了两个等级，使用 level 字段来进行控制，默认为 level = 1
* level = 1时，框架生成 render 函数中完成保留 template 中的计算逻辑，setData 传输量保持了最优。
* level = 2时，框架生成 render 函数中仅保留所有 template 中使用到的响应性变量，无任何计算逻辑保留，render 函数体积达最小状态，但 setData 传输量相对于 level=1 会有所增加。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        optimizeRenderRules: {
          include: [
            resolve('src')
          ],
          level: 1
        }
      }
    }
  }
})
```

### asyncSubpackageRules

```ts
type Condition = string | Function | RegExp

interface AsyncSubpackageRules {
  include: Condition | Array<Condition>
  exclude?: Condition | Array<Condition>
  root: string
  placeholder: string | { name: string, resource?: string}
}
```
  * include: 同 webpack include 规则
  * exclude: 同 webpack exclude 规则
  * root: 匹配规则的组件或js模块的输出分包名
  * placeholder: 匹配规则的组件所配置的componentPlaceholder，可支持配置原生组件和自定义组件，原生组件可直接以string类型配置，自定义组件需要配置对象，name 为该自定义组件名, resource 为自定义组件的路径，路径可为绝对路径和相对于项目目录的相对路径

异步分包场景下批量设置组件或 js 模块的异步分包，提升资源异步分包输出的灵活性。

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        // include 可以是正则、字符串、函数、数组
        asyncSubpackageRules: [
          {
            include: '/project/pages', // 文件路径包含 '/project/pages' 的组件或者 require.async 异步引用的js 模块都会被打包至sub1分包
            root: 'sub1',
            placeholder: 'view'
          }
        ]
      }
    }
  }
})
```

:::warning
* 该配置匹配的组件，若使用方在引用路径已设置?root或componentPlaceholder，则以引用路径中的?root或componentPlaceholder为最高优先级
* 若placeholder配置使用自定义组件，注意一定要配置 placeholder 中的 resource 字段
* 本功能只会对使用require.async异步引用的js模块生效，若引用路径中已配置?root，则以路径中?root优先
:::

### retryRequireAsync

`boolean = false`

开启时在处理`require.async`时会添加单次重试逻辑

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        retryRequireAsync: true
      }
    }
  }
})
```

### enableAliRequireAsync

`boolean = false`

支付宝在`2.8.2`基础库版本后开始支持分包异步化，开启此配置时Mpx的分包异步构建能力能在输出支付宝时生效，不开启时则还是采用兜底策略进行构建来兼容`2.8.2`之前的基础库版本

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        enableAliRequireAsync: true
      }
    }
  }
})
```

### optimizeSize

`boolean = false`

开启后可优化编译配置减少构建产物体积

```js
// vue.config.js
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        optimizeSize: true
      }
    }
  }
})
```

## MpxWebpackPlugin static methods

`MpxWebpackPlugin` 通过静态方法暴露了以下五个内置 loader，详情如下：

### MpxWebpackPlugin.loader

`MpxWebpackPlugin` 所提供的最主要 loader，用于处理 `.mpx` 文件，根据不同的[目标平台](#mode)将 `.mpx` 文件输出为不同的结果。

> 在微信环境下 `todo.mpx` 被loader处理后的文件为：`todo.wxml`、`todo.wxss`、`todo.js`、`todo.json`

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.mpx$/,
        use: MpxWebpackPlugin.loader()
      }
    ]
  }
};
```

### MpxWebpackPlugin.pluginLoader

:::warning
该 loader 仅在开发**小程序插件**时使用，可在使用 Mpx 脚手架进行项目初始化时选择进行组件开发来生成对应的配置文件。
:::

`MpxWebpackPlugin.pluginLoader` 用于根据开发者编写的`plugin.json`文件内容，将特定的小程序组件、页面以及 js 文件进行构建，最终以小程序插件的形式输出。

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
module.exports = defineConfig({
  configureWebpack() {
    return {
      module: {
        rules: [
          {
            resource: path.resolve('src/plugin/plugin.json'), // 小程序插件的plugin.json的绝对路径
            use: MpxWebpackPlugin.pluginLoader()
          }
        ]
      }
    }
  }
})
```

更多细节请查阅 [小程序插件开发](https://developers.weixin.qq.com/miniprogram/dev/framework/plugin/development.html)

### MpxWebpackPlugin.wxsPreLoader

加载并解析 `wxs` 脚本文件，并针对不同平台，做了差异化处理；同时可支持处理内联`wxs`。

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
module.exports = defineConfig({
  configureWebpack() {
    return {
      module: {
        rules: [
          {
            test: /\.(wxs|qs|sjs|filter\.js)$/,
            loader: MpxWebpackPlugin.wxsPreLoader(),
            enforce: 'pre'
          }
        ]
      }
    }
  }
})
```

### MpxWebpackPlugin.fileLoader

提供图像资源的处理，生成对应图像文件，输出到输出目录并返回 public URL。如果是分包资源，则会输出到相应的分包资源文件目录中。

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
module.exports = defineConfig({
  configureWebpack() {
    return {
      module: {
        rules: [
          {
            test: /\.(png|jpe?g|gif|svg)$/,
            loader: MpxWebpackPlugin.fileLoader({
              name: 'img/[name][hash].[ext]'
            })
          }
        ]
      }
    }
  }
})
```

**选项**：

- `name` : 自定义输出文件名模板

### MpxWebpackPlugin.urlLoader

微信小程序对于图像资源存在一些限制，`MpxWebpackPlugin.urlLoader` 针对这些差异做了相关处理，开发者可以使用web应用开发的方式进行图像资源的引入，`MpxWebpackPlugin.urlLoader` 可根据图像资源的不同引入方式，支持 CDN 或者 Base64 的方式进行处理。更多细节请查阅[图像资源处理](../guide/advance/image-process.md)。

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
module.exports = defineConfig({
  configureWebpack() {
    return {
      module: {
        rules: [
          {
            test: /\.(png|jpe?g|gif|svg)$/,
            loader: MpxWebpackPlugin.urlLoader({
              name: 'img/[name][hash].[ext]',
              limit: 2048,
            })
          }
        ]
      }
    }
  }
})
```

**选项**:

- `name` :  自定义输出文件名模板
- `mimetype` : 指定文件的 MIME 类型
- `limit` : 对内联文件作为数据 URL 的字节数限制
- `publicPath` : 自定义 public 目录
- `fallback` : 文件字节数大于限制时，为文件指定加载程序

### MpxWebpackPlugin.getPageEntry

在 webpack config entry 入口文件配置中，你可以使用该方法获取独立构建页面路径，构建产物为该页面的独立原生代码，
你可以提供该页面给其他小程序使用。

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
module.exports = defineConfig({
  chainWebpack(config) {
    config.entry('index').add(MpxWebpackPlugin.getPageEntry('./index.mpx'))
  }
})
```

### MpxWebpackPlugin.getComponentEntry

在 webpack config entry 入口文件配置中，你可以使用该方法获取独立构建组件路径，构建产物为该组件的独立原生代码，
你可以提供该组件给其他小程序使用。

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
module.exports = defineConfig({
  chainWebpack(config) {
    config.entry('index').add(MpxWebpackPlugin.getComponentEntry('./components/list.mpx'))
  }
})
```


## MpxUnocssPlugin

Mpx 编译 unocss 原子类的 webpack 主插件

如果在使用 `@mpxjs/cli@3.x` 创建项目时选择了 unocss，会自动安装 MpxUnocssPlugin ，直接在 mpx.unocss 配置项中传入相关配置即可
```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      unocss: {
        // @mpxjs/unocss-plugin 相关的配置
      }
    }
  }
})
```

如果创建项目时未选 unocss，需手动安装，安装示例如下：

```bash 
npm install -D @mpxjs/unocss-plugin
pnpm install -D @mpxjs/unocss-plugin
yarn add -D @mpxjs/unocss-plugin
```

使用示例如下：

```js
  // vue.config.js
  const MpxUnocssPlugin = require('@mpxjs/unocss-plugin')
  const { defineConfig } = require('@vue/cli-service')

  module.exports = defineConfig({
    configureWebpack: {
      plugins: [
        new MpxUnocssPlugin({
          // @mpxjs/unocss-plugin 相关的配置
        })
      ]
    },
  })
```

插件支持配置如下：

### unoFile

`string = 'styles/uno'`

生成主包或分包通用样式存储的相对路径

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      unocss: {
        unoFile: 'styles/uno'
      }
    }
  }
})
```
则会把通用样式存储到下面目录
```js
  // 主包
  dist/wx/styles/uno.wxss
  // 分包
  dist/wx/package/styles/uno.wxss
```

### minCount

`number = 2`

使用到某个原子类的最小分包个数，比如设置为2的话一个原子类只有超过2个分包使用才会输出到主包
> 主要是用来控制主包占用的，数值越大分包的原子类就有更大可能性不占用主包
```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      unocss: {
        minCount: 2
      }
    }
  }
})
```
```html
  <!-- minCount=2 -->
  <!-- a分包 -->
  <view class="bg-black color-white"></view>
  <!-- b分包 -->
  <view class="bg-black"></view>
```
unocss将把生成的`bg-black`样式打包到主包

### styleIsolation

`string = 'isolated'`

需要和微信小程序的styleIsolation配合使用，比如小程序使用样式隔离的话，这里需要对应配置为isolated，这样的话每个组件会独立引用对应的原子类文件，配置为'apply-shared'的话只有父级页面和app会建立引用，然后通过配合微信的apply-shared的方式获取父级上定义的原子类

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      unocss: {
        styleIsolation: 'isolated'
      }
    }
  }
})
```

### scan

```ts
  interface Scan {
    include?: string[]
    exclude?: string[]
  }
```

配置需要扫描的文件目录

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      unocss: {
        scan: {
          include: ['src/**/*']
        }
      }
    }
  }
})
```

### escapeMap

`object`

针对原子类中出现的`[` `(` `,`等特殊字符，在web中会通过转义字符`\`进行转义，由于小程序环境下不支持css选择器中出现`\`转义字符，我们内置支持了一套不带`\`的转义规则对这些特殊字符进行转义，同时替换模版和css文件中的类名，内建的默认转义规则，可自定义转译规则
```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      unocss: {
        escapeMap: {
          ':': '_d_',
        }
      }
    }
  }
})
```
```css
  <view class="dark:text-green-400"/>
```
将会转化为
```css
  .dark .dark_d_text-green-400{--un-text-opacity:1;color:rgba(74,222,128,var(--un-text-opacity));}
```

### root

`string = process.cwd()`

文件根目录

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      unocss: {
        root: process.cwd()
      }
    }
  }
})
```

### transformCSS

`boolean = true`

转化css指令为常规css

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      unocss: {
        transformCSS: true
      }
    }
  }
})
```
```css
  .custom-div {
    @apply text-center my-0 font-medium;
  }
```
将会转化为
```css
  .custom-div {
    margin-top: 0;
    margin-bottom: 0;
    text-align: center;
    font-weight: 500;
  }
```

### transformGroups

`boolean = true`

转化Variant group
```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      unocss: {
        transformGroups: true
      }
    }
  }
})
```
```html
  <view class="lg:(p-2 m-2 text-red-600)"></view>
```
将会转化为
```html
  <view class="lg:p-2 lg:m-2 lg:text-red-600"></view>
```

### config

`UserConfig | string`

config可以传配置对象也可以传一个配置文件路径

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      unocss: {
        config: {
          rules: [
            ['m-1', { margin: '10rpx' }],
          ]
        }
      }
    }
  }
})
```

### configFiles

`LoadConfigSource[]`

```ts
  interface LoadConfigSource<T = any> {
      files: Arrayable<string>;
      /**
       * @default ['mts', 'cts', 'ts', 'mjs', 'cjs', 'js', 'json', '']
      */
      extensions?: string[];
      /**
       * Loader for loading config,
      *
      * @default 'auto'
      */
      parser?: BuiltinParsers | CustomParser<T> | 'auto';
      /**
       * Rewrite the config object,
      * return nullish value to bypassing loading the file
      */
      rewrite?: <F = any>(obj: F, filepath: string) => Promise<T | undefined> | T | undefined;
      /**
       * Transform the source code before loading,
      * return nullish value to skip transformation
      */
      transform?: (code: string, filepath: string) => Promise<string | undefined> | string | undefined;
      /**
       * Skip this source if error occurred on loading
      *
      * @default false
      */
      skipOnError?: boolean;
  }
```
configFiles的话是传递额外的配置文件数组，比如不想用uno.config作为配置文件的话可以在这里面配

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      unocss: {
        configFiles: [
          {
            files: [
              'uno2.config.js'
            ]
          }
        ]
      }
    }
  }
})
```

### commentConfig
  我们还支持了commentConfig进行组件局部配置，目前支持safelist和styleIsolation，safelist可以用空格分隔写多个

  ```html
    <template>
      <!-- mpx_config_styleIsolation: 'isolated' -->
      <!-- mpx_config_safelist: 'text-red-500 bg-black' -->
      <view>mpx-unocss</view>
    </template>
  ```

## MpxUnocssBase

Mpx 内置的 unocss preset，继承自 `@unocss/preset-uno`，并额外提供小程序原子类的预设样式，安装示例如下：

```bash 
npm install -D @mpxjs/unocss-base
pnpm install -D @mpxjs/unocss-base
yarn add -D @mpxjs/unocss-base
```

使用示例如下：

```js
  // uno.config.js
  const { defineConfig } = require('unocss')
  const presetMpx = require('@mpxjs/unocss-base')

  module.exports = defineConfig({
    presets: [
      presetMpx({
        // ...
      })
    ],
    // unocss的config，具体配置参考https://unocss.dev/config/
  })
```

支持的配置项如下：

### baseFontSize

`number = 37.5`
 
同比换算1rem = 37.5rpx适配小程序
```js
  // uno.config.js
  const { defineConfig } = require('unocss')
  const presetMpx = require('@mpxjs/unocss-base')

  module.exports = defineConfig({
    presets: [
      presetMpx({
        baseFontSize: 37.5
      })
    ],
  })
```
### preflight

`boolean = true`

是否生成预设样式
```js
  // uno.config.js
  const { defineConfig } = require('unocss')
  const presetMpx = require('@mpxjs/unocss-base')

  module.exports = defineConfig({
    presets: [
      presetMpx({
        preflight: true
      })
    ],
  })
```
将添加预设样式在主包
```css
page{--un-rotate:0;--un-rotate-x:0;--un-rotate-y:0;--un-rotate-z:0;--un-scale-x:1;--un-scale-y:1;--un-scale-z:1;--un-skew-x:0;--un-skew-y:0;--un-translate-x:0;--un-translate-y:0;--un-translate-z:0;--un-pan-x: ;--un-pan-y: ;--un-pinch-zoom: ;--un-scroll-snap-strictness:proximity;--un-ordinal: ;--un-slashed-zero: ;--un-numeric-figure: ;--un-numeric-spacing: ;--un-numeric-fraction: ;--un-border-spacing-x:0;--un-border-spacing-y:0;--un-ring-offset-shadow:0 0 rgba(0,0,0,0);--un-ring-shadow:0 0 rgba(0,0,0,0);--un-shadow-inset: ;--un-shadow:0 0 rgba(0,0,0,0);--un-ring-inset: ;--un-ring-offset-width:0px;--un-ring-offset-color:#fff;--un-ring-width:0px;--un-ring-color:rgba(147,197,253,0.5);--un-blur: ;--un-brightness: ;--un-contrast: ;--un-drop-shadow: ;--un-grayscale: ;--un-hue-rotate: ;--un-invert: ;--un-saturate: ;--un-sepia: ;--un-backdrop-blur: ;--un-backdrop-brightness: ;--un-backdrop-contrast: ;--un-backdrop-grayscale: ;--un-backdrop-hue-rotate: ;--un-backdrop-invert: ;--un-backdrop-opacity: ;--un-backdrop-saturate: ;--un-backdrop-sepia: ;}
```
### dark

`class | media | DarkModeSelectors = 'class'`
```ts
  interface DarkModeSelectors {
    /**
     * light variant的选择器.
     *
     * @default '.light'
     */
    light?: string

    /**
     * dark variant的选择器
     *
     * @default '.dark'
     */
    dark?: string
  }
```
默认情况下，此预设使用dark:variant生成基于类的dark模式。
```html
  <view class="dark:text-green-400" />
```
我们将生成
```css
  .dark .dark_c_text-green-400{--un-text-opacity:1;color:rgba(74,222,128,var(--un-text-opacity));}
```
要选择基于媒体查询的dark模式，您可以使用@dark:variant
```html
  <view class="@dark:text-green-400" />
```
我们将生成
```css
  @media (prefers-color-scheme: dark){
    ._u_dark_c_text-green-400{--un-text-opacity:1;color:rgba(74,222,128,var(--un-text-opacity));}
  }
```
或者使用针对dark:variant的配置进行全局设置
```js
  presetMpx({
    dark: "media"
  })
```
### attributifyPseudo

`boolean = false`

将伪选择器生成为[group='']，而不是.group。只支持`group`|`peer`|`parent`|`previous`
如果attributifyPseudo为true的话，
```html
  <view class="group">
    <view class="group-hover:opacity-100" />
  </view>
```
上面template将生成
```css
  [group=""]:hover .group-hover_c_opacity-100{opacity:1;}
```
为false则生成
```css
  .group:hover .group-hover_c_opacity-100{opacity:1;}
```
### variablePrefix

`string = 'un-'`

CSS变量的前缀

```js
  presetMpx({
    variablePrefix: 'un-'
  })
```
```css
  .bg-red-500{--un-bg-opacity:1;background-color:rgba(239,68,68,var(--un-bg-opacity));}
```
  
## Request query

Mpx中允许用户在request中传递特定query执行特定逻辑，目前已支持的query如下：

### ?resolve

用于获取资源最终被输出的正确路径。

Mpx 在处理页面路径时会把对应的分包名作为 root 加在路径前。处理组件路径时会添加 hash，防止路径名冲突。直接写资源相对路径可能与最终输出的资源路径不符。

编写代码时使用 import 引入页面地址后加上 `?resolve`，这个地址在编译时会被处理成正确的绝对路径，即资源的最终输出位置。

``` javascript
import subPackageIndexPage from '../subpackage/pages/index.mpx?resolve'

mpx.navigateTo({
  url: subPackageIndexPage
})
```

### ?root

1. 声明分包别名

指定分包别名，Mpx 项目在编译构建后会输出该别名的分包，外部小程序或 H5 页面跳转时，可直接配置该分包别名下的资源路径。

```js
// 可在项目app.mpx中进行配置
module.exports = {
  packages: [
    '@packagePath/src/app.mpx?root=test',
  ]
}

// 使用
wx.navigateTo({url : '/test/homepage/index'})
```

2. 声明组件所属异步分包

微信小程序新增 [分包异步化特性](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/async.html) ，使跨分包的组件可以等待对应分包下载后异步使用, 在mpx中使用需通过?root声明组件所属异步分包即可使用，示例如下：

```html
<!--/packageA/pages/index.mpx-->
// 这里在分包packageA中即可异步使用分包packageB中的hello组件
<script type="application/json">
  {
    "usingComponents": {
      "hello": "../../packageB/components/hello?root=packageB",
      "simple-hello": "../components/hello"
    },
    "componentPlaceholder": {
      "hello": "simple-hello"
    }
  }
</script>
```

### ?fallback

`boolean`

对于使用`MpxWebpackPlugin.urlLoader`的文件，如果在引用资源的末尾加上`?fallback=true`，则使用配置的自定义loader。图片的引入和处理详见[图像资源处理](../guide/advance/image-process.html)。

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      urlLoader: {
        name: 'img/[name][hash].[ext]',
        publicPath: 'http://a.com/',
        fallback: 'file-loader' // 自定义fallback为true时使用的loader
      }
    }
  }
})
```

```css
/* png资源引入 */
<style>
  .logo2 {
    background-image: url('./images/logo.png?fallback=true'); /* 设置fallback=true，则使用如上方所配置的file-loader */
  }
</style>
```

### ?useLocal

`boolean`

静态资源存放有两种方式：本地、远程（配置 publicPath ）。useLocal 是用于在配置了 publicPath 时声明部分资源输出到本地。比如配置了通用的 CDN 策略，但如网络兜底资源需要强制走本地存储，可在引用资源的末尾加上`?useLocal=true`

```css
/* 单个图片资源设置为存储到本地 */
<style>
  .logo2 {
    background-image: url('./images/logo.png?useLocal=true');
  }
</style>
```

### ?isStyle

`boolean`

isStyle 是在非 style 模块中编写样式时，声明这部分引用的静态资源按照 style 环境来处理。如在 javascript 中 require 了一个图像资源，然后模版 template style 属性中进行引用， 则 require 资源时可选择配置`?isStyle=true`

```html
<template>
  <view class="list">
    <!-- isStyle 案例一：引用 javascript 中的数据 -->
    <view style="{{testStyle}}">测试</view>
    <!-- isStyle 案例二：设置资源按照style处理规则处理。style处理规则为: 默认走base64，除非同时配置了 publicPath 和 fallback -->
    <image src="../images/car.jpg?isStyle=true"></image>
    <!-- 普通非style模式，默认走 fallback 或者 file-loader 解析，输出到 publicPath 或者 本地img目录下 -->
    <image src="../images/car.jpg"></image>
  </view>
</template>
```
```js
/* 将 script 中的图像资源标识为 style 资源 */
<script>
  import { createComponent } from '@mpxjs/core'
  const backCar = require('../images/car.jpg?isStyle=true')

  createComponent({
    data: {},
    computed: {
      testStyle () {
        return `background-image : url(${backCar}); width:100px; height: 100px`
      }
    }
  })
</script>
```

### ?isPage

`boolean`

在 webpack config entry 入口文件配置中，你可以在路径后追加 ?isPage 来声明独立页面构建，构建产物为该页面的独立原生代码，
你可以提供该页面给其他小程序使用。此外，独立页面构建也可以通过MpxWebpackPlugin.getPageEntry生成，推荐使用[此方法。](#mpxwebpackplugin-getpageentry)

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
module.exports = defineConfig({
  chainWebpack(config) {
    config.entry('index').add('../src/pages/index.mpx?isPage')
    // 或者
    // config.entry('index').add(MpxWebpackPlugin.getPageEntry('./index.mpx'))
  }
})
```

:::warning
对于使用 `@mpxjs/cli@2.x` 脚手架初始化的项目，配置 entry 的方式如下
```js
// build/getWebpackConf.js
module.exports = {
  entry: {
    index: '../src/pages/index.mpx?isPage'
  }
}
```
:::

### ?isComponent

`boolean`

在 webpack config entry 入口文件配置中，你可以在路径后追加 ?isComponent 来声明独立组件构建，构建产物为该组件的独立原生代码，
你可以提供该组件给其他小程序使用。
此外，独立组件构建也可以通过MpxWebpackPlugin.getComponentEntry生成，推荐使用[此方法。](#mpxwebpackplugin-getcomponententry)。

```js
// vue.config.js
const { defineConfig } = require('@vue/cli-service')
const MpxWebpackPlugin = require('@mpxjs/webpack-plugin')
module.exports = defineConfig({
  chainWebpack(config) {
    config.entry('index').add('../src/components/list.mpx?isComponent')
    // 或者
    // config.entry('index').add(MpxWebpackPlugin.getComponentEntry('./components/list.mpx'))
  }
})
```

### ?async

`boolean | string`

输出 H5 时 Vue Router 的路由懒加载功能，Mpx框架默认会对分包开启路由懒加载功能并将分包所有页面都打入同一个Chunk
，如果你希望对于部分主包页面或者分包页面配置路由懒加载并想自定义Chunk Name，则可以使用该功能。

```html
// app.mpx 
<script type="application/json">
  {
    "pages": [
      "./pages/index?async", // 主包页面配置路由懒加载，Chunk Name 为随机数字
      "./pages/index2?async=app_pages2"，// 主包页面配置路由懒加载，Chunk Name 自定义为 app_pages2
    ],
    "packages": [
      "./packages/sub1/app.mpx?root=sub1"
    ]
  }
</script>

// packages/sub1/app.mpx

<script type="application/json">
  {
    "pages": [
      "./pages/index?async=sub1_pages_index", // 分包中页面设置路由懒加载并设置自定义Chunk Name
      "./pages/index2?async=sub2_pages_index2" // 分包中页面设置路由懒加载并设置自定义Chunk Name
    ]
  }
</script>

```
