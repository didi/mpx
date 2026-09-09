# 样式定义 {#style-definition}

## 基础语法 {#basic-syntax}

Mpx 中的样式定义遵循 WXSS (WeiXin Style Sheets) 规范，WXSS 具有 CSS 大部分特性，同时为了更适合开发微信小程序，对 CSS 进行了扩充以及修改。

### 尺寸单位 {#size-units}

`rpx`（responsive pixel）: 可以根据屏幕宽度进行自适应。规定屏幕宽为 750rpx。如在 iPhone6 上，屏幕宽度为 375px，共有 750 个物理像素，则 750rpx = 375px = 750物理像素，1rpx = 0.5px = 1物理像素。

**设备 rpx 换算 px (屏幕宽度/750)**

| 设备 | rpx换算px (屏幕宽度/750) | px换算rpx (750/屏幕宽度) |
| :--- | :--- | :--- |
| iPhone5 | 1rpx = 0.42px | 1px = 2.34rpx |
| iPhone6 | 1rpx = 0.5px | 1px = 2rpx |
| iPhone6 Plus | 1rpx = 0.552px | 1px = 1.81rpx |

> **建议**：开发微信小程序时设计师可以用 iPhone6 作为视觉稿的标准。

### 样式导入 {#style-import}

使用 `@import` 语句可以导入外联样式表，`@import` 后跟需要导入的外联样式表的相对路径，用 `;` 表示语句结束。

```css
/** common.wxss **/
.small-p {
  padding:5px;
}
```

```css
/** app.wxss **/
@import "common.wxss";
.middle-p {
  padding:15px;
}
```

### 选择器 {#selectors}

目前支持的选择器有：

| 选择器 | 样例 | 样例描述 |
| :--- | :--- | :--- |
| .class | .intro | 选择所有拥有 class="intro" 的组件 |
| #id | #firstname | 选择拥有 id="firstname" 的组件 |
| element | view | 选择所有 view 组件 |
| element, element | view, checkbox | 选择所有文档的 view 组件和所有的 checkbox 组件 |
| ::after | view::after | 在 view 组件后边插入内容 |
| ::before | view::before | 在 view 组件前边插入内容 |

> **注意**
> - 当需要跨端输出 React Native 时，仅支持类选择器（.class）。


## CSS 预编译 {#css-precompile}

Mpx 支持 CSS 预编译处理，你可以通过在 style 标签上设置 `lang` 属性，来指定使用的 CSS 预处理器，此外需要在对应的 webpack 配置文件中
加入对应的 loader 配置

```html
<!-- 使用 stylus -->
<style lang="stylus">
  .nav
    width 100px
    height 80px
    color #f90
    &:hover
      background-color #f40
      color #fff
</style>

// getRules 配置文件
rules: [
    {
        test: /\.styl(us)?$/,
        use: [
            MpxWebpackPlugin.wxssLoader(),
            'stylus-loader'
        ]
    }
]
```
```html
<!-- 使用 sass  -->
<style lang="scss">
  .nav {
    width: 100px;
    height: 80px;
    color: #f90
    &:hover {
      background-color: #f40;
      color: #fff
    }
  }
</style>

// getRules 配置文件
rules: [
    {
        test: /\.scss$/,
        use: [
            'css-loader',
            'sass-loader'
        ]
    }
]
```
```html
<!-- 使用 less -->
<style lang="less">
  .size {
    width: 100px;
    height: 80px
  }
  .nav {
    .size();
    color: #f90;
    &:hover {
      background-color: #f40;
      color: #fff
    }
  }
</style>

// getRules 配置文件
rules: [
    {
        test: /\.less$/,
        use: [
            'css-loader',
            'less-loader'
        ]
    }
]

```

## 公共样式复用 {#common-style-reuse}

为了达到最大限度的样式复用，Mpx 提供了以下两种方式实现公共样式抽离，但是最终打包的效果有所区别。

``` styl
// styles/mixin.styl
.header-styl
  width 100%
  height 100px
  background-color #f00
```

### style src 复用 {#style-src-reuse}

通过给 style 标签添加 src 属性引入外部样式，最终公共样式代码只会打包一份。

``` html
<!-- index.mpx -->
<style lang="stylus" src="../styles/common.styl"></style>
```

``` html
<!-- list.mpx -->
<style lang="stylus" src="../styles/common.styl"></style>
```

Mpx 将 common.styl 中的代码经过 loader 编译后生成一份单独的 wxss 文件，这样既实现了样式抽离，又能节省打包后的代码体积。

### @import 复用 {#import-reuse}

如果指定 style 标签的 lang 属性并且使用 @import 导入样式，那么这个文件经过对应的 loader 处理之后的内容会重复打包到引用它的文件目录下，并不会抽离成单独的文件，这样无形中增加了代码体积。

``` html
<!-- index.mpx -->
<style lang="stylus">
  @import "../styles/mixin.styl"
</style>
```

``` html
<!-- list.mpx -->
<style lang="less">
  @import "../styles/mixin.less";
</style>
```

如果导入的是一份 css 文件，则最终打包后的效果与 style src 一致。

``` styl
// styles/mixin.css
.header-css {
  width: 100%;
  height: 100px;
  background-color: #f00;
}
```

``` html
<!-- index.mpx -->
<style>
  @import "../styles/mixin.css";
</style>
```

``` html
<!-- list.mpx -->
<style>
  @import "../styles/mixin.css";
</style>
```

对于多个页面或组件公用的样式，建议使用 style src 形式引入，避免一份样式被内联打成多份，同时还能使用 less、scss 等提升编码效率。

## CSS 压缩 {#css-compress}

在 production 模式下，框架默认会使用 [`cssnano`](https://www.cssnano.cn/) 对 css 内容进行压缩。

框架默认内置 cssnano 的 default 预设，默认配置为：

```js
cssnanoConfig = {
  preset: ['cssnano-preset-default', minimizeOptions.optimisation || {}]
}
```
以上配置为框架内置，开发者无需手动配置。

如果你想要使用 cssnano advanced 预设，则需要在 wxssLoader 中传入配置开启

```js
{
  test: /\.(wxss|acss|css|qss|ttss|jxss|ddss)$/,
  use: [
    MpxWebpackPlugin.wxssLoader({
      minimize: {
        advanced: true, // 使用 cssnano advanced preset
        optimisation: {
          'autoprefixer': true,
          'discardUnused': true,
          'mergeIdents': true
        }
      }
    })
  ]
},
```

同时也需要安装 advanced 依赖：

```bash
npm i -D cssnano-preset-advanced
```

optimisation 配置可以点击[详情](https://www.cssnano.cn/docs/what-are-optimisations/)查看更多配置项。

## 原子类 {#utility-class}

Mpx 框架内置了基于 [unocss](https://unocss.dev/) 的原子类支持，让小程序开发也能使用原子类。用户可以在 Mpx 页面/组件模板中直接使用一些预定义的基础样式类，诸如 `flex`，`pt-4`，`text-center` 和 `rotate-90` 等，对样式进行组合定义。

### 简单示例 {#simple-example}

```html
<view class="container">
  <view class="flex">
    <view class="py-8 px-8 inline-flex mx-auto bg-white rounded-xl shadow-md">
      <view class="text-center">
        <view class="text-base text-black font-semibold mb-2">
          Erin Lindford
        </view>
        <view class="text-gray-500 font-medium pb-3">
          Product Engineer
        </view>
        <view
          class="mt-2 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-solid border-purple-200">
          Message
        </view>
      </view>
    </view>
  </view>
</view>
```

更多详细用法请查看[使用原子类](../advance/utility-first-css.md)。
