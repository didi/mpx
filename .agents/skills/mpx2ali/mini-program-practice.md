# 微信与支付宝小程序跨端开发最佳实践

本文基于 [Cooper · 小程序Skill-小程序差异梳理](https://cooper.didichuxing.com/knowledge/2204542687022/2209726031013) 整理，面向使用微信语法开发、同时输出微信与支付宝小程序的 Mpx 项目，另保留原文涉及 iOS RN 文本裁切的补充案例。

原文“微信与支付宝差异梳理”部分的版本基准为：微信基础库 `2.20.3+`、支付宝基础库 `2.9.81+`、`@mpxjs/core` / `@mpxjs/api-proxy` `2.10.18-beta.12`、`@mpxjs/webpack-plugin` `2.10.18-beta.17`。人工踩坑记录未全部标注机型、宿主及基础库版本，不应视为所有版本的固定行为。本文保留原文的验证状态；代码示例是按场景整理的写法，未进行真机验证。

## 目录

- [文本与图片样式](#文本与图片样式)
  - [溢出打点样式直接作用于 text](#溢出打点样式直接作用于-text)
  - [图片内边距交给外层容器](#图片内边距交给外层容器)
- [输入框与键盘](#输入框与键盘)
  - [按宿主与操作系统选择输入框属性](#按宿主与操作系统选择输入框属性)
  - [处理键盘事件时序与首次聚焦](#处理键盘事件时序与首次聚焦)
- [滚动容器与弹层](#滚动容器与弹层)
  - [按平台隐藏滚动条](#按平台隐藏滚动条)
  - [将蒙层与可滚动内容拆成兄弟节点](#将蒙层与可滚动内容拆成兄弟节点)
- [系统信息与尺寸](#系统信息与尺寸)
  - [区分屏幕高度与可用窗口高度](#区分屏幕高度与可用窗口高度)
- [组件样式隔离](#组件样式隔离)
  - [通过编译配置或 scoped 隔离组件样式](#通过编译配置或-scoped-隔离组件样式)
- [页面配置](#页面配置)
  - [按编译器能力配置自定义导航栏](#按编译器能力配置自定义导航栏)
  - [区分禁止页面滚动与关闭纵向回弹](#区分禁止页面滚动与关闭纵向回弹)
- [跨端输出 RN 的补充案例](#跨端输出-rn-的补充案例)
  - [为 iOS 单行文本保留足够行高](#为-ios-单行文本保留足够行高)
- [历史问题与验证范围](#历史问题与验证范围)

---

## 文本与图片样式

### 溢出打点样式直接作用于 text

**原文验证状态：已验证，问题存在；新版 Mpx 已提供默认兼容样式。**

支付宝 `text` 的默认换行行为可能覆盖外层容器的 `white-space: nowrap`。新版 `@mpxjs/webpack-plugin` 在支付宝完整 App 构建中会先于业务全局样式加载 `text { white-space: inherit }`，因此内部 `text` 默认可以继承父节点的换行方式，业务显式样式仍可覆盖该默认值。

**❌ 避免：**只给外层设置溢出样式，依赖内部 `text` 继承。

```html
<template>
  <view class="ellipsis">
    <text>{{title}}</text>
  </view>
</template>

<style>
  .ellipsis {
    width: 240rpx;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
```

**✅ 推荐：**升级后可由父容器控制换行；宽度和溢出规则仍应放在实际承担截断布局的节点上。直接约束 `text` 仍是边界最明确的写法。

```html
<template>
  <text class="title">{{title}}</text>
</template>

<style>
  .title {
    display: block;
    width: 240rpx;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
```

图文混排时，应先明确哪一段文字需要截断，再约束对应文本节点的宽度。原文没有给出适用于所有图文混排结构的统一方案，不应直接给整段混排内容套用此示例。

### 图片内边距交给外层容器

**原文验证状态：已验证，问题存在。**

直接在 `image` 上设置 `padding`，微信与支付宝可能出现不同的图片尺寸和内容显示结果。原文配图中，同为 `height: 20px; padding: 50px 0` 的图片，在两端显示高度明显不同。不要依赖图片节点自身对内边距的处理来控制留白。

**❌ 避免：**图片尺寸与内边距混在同一个节点上。

```html
<template>
  <image class="banner" src="{{bannerUrl}}" />
</template>

<style>
  .banner {
    width: 240rpx;
    height: 80rpx;
    padding: 24rpx;
  }
</style>
```

**✅ 推荐：**外层容器负责内边距，`image` 只负责图片尺寸与显示模式。

```html
<template>
  <view class="banner-wrapper">
    <image class="banner" src="{{bannerUrl}}" mode="aspectFit" />
  </view>
</template>

<style>
  .banner-wrapper {
    padding: 24rpx;
  }

  .banner {
    width: 240rpx;
    height: 80rpx;
  }
</style>
```

---

## 输入框与键盘

### 按宿主与操作系统选择输入框属性

**原文验证状态：部分存在。**支付宝 Android 下 `enableNative: true` 导致大片留白、iOS 下 `enableNative: false` 导致光标偏移的问题已记录；微信 iOS / Android 的历史问题在原文复验时均未复现。

固定定位弹层中的输入框需要同时区分“小程序宿主”和“设备操作系统”。`__mpx_mode__ === 'ali'` 表示输出支付宝小程序，不能据此判断运行设备是 iOS 还是 Android。

| 场景 | 原文建议 | 使用边界 |
| --- | --- | --- |
| 微信 iOS | `always-embed="{{true}}"` | 原文记录该属性仅在 iOS 生效；仍需验证当前宿主版本 |
| 微信 Android | 出现自动上推留白时，考虑关闭 `adjust-position` 后手动处理 | 原文复验未复现，不应默认关闭自动上推 |
| 支付宝 iOS | `enableNative="{{true}}"` | 用于处理原文记录的光标偏移 |
| 支付宝 Android | `enableNative="{{false}}"` | 用于处理原文记录的大片留白 |

**❌ 避免：**在支付宝所有设备上写死同一个 `enableNative` 值，或把微信的键盘上推属性当成支付宝的等价能力。

```html
<template>
  <input enableNative@ali="{{true}}" />
</template>
```

**✅ 推荐：**将宿主专有属性限定在对应目标平台，并通过运行时系统信息提供 `isIOS`。

```html
<template>
  <input
    always-embed@wx="{{true}}"
    enableNative@ali="{{isIOS}}"
  />
</template>
```

这里的 `isIOS` 是业务侧依据实际设备系统信息得到的布尔值，需在页面或组件数据中提供。不要用 `__mpx_mode__ === 'ios'` 生成它：`ios` 是 Mpx 输出 RN 的目标标识，不是支付宝小程序内的设备判断。

### 处理键盘事件时序与首次聚焦

原文记录，微信不同键盘类型、收起方式与输入框切换场景下，`keyboardheightchange` 的触发情况可能不同，`focus`、`blur` 与高度变化事件也没有可依赖的固定先后顺序。支付宝弹层首次显示时立即聚焦，还可能出现键盘弹起但页面未按预期上推的情况。

**❌ 避免：**

- 仅监听 `keyboardheightchange`，认为每次键盘开合都会通知。
- 任意输入框触发 `blur` 就立即把键盘高度清零，忽略另一个输入框可能正在获得焦点。
- 弹层刚开始渲染就强制聚焦，依赖固定延迟适配所有设备。
- 未复现问题就同时启用宿主自动上推和业务手动位移。

**✅ 推荐：**

1. 先验证当前宿主的自动上推行为；仅在复现问题后选择手动处理。
2. 微信若改用手动位移，应关闭相应输入框的 `adjust-position`，结合 `focus`、`blur` 与 `keyboardheightchange` 维护当前聚焦输入框及键盘状态。
3. 输入框切换时，延后确认是否仍有输入框聚焦，再决定是否复位；不要假设事件到达顺序。
4. 支付宝首次弹层聚焦应等待弹层实际渲染完成；存在入场动画时，还需结合弹层的完成时机。
5. 将文字键盘、数字键盘、主动收起、触摸滚动收起、连续切换输入框分别纳入真机验证。

原文未提供可复用的完整键盘状态机，也未给出支付宝可等价替代微信 `adjust-position` 的控制方案。这部分应按实际弹层结构与宿主表现实现，不宜沉淀为一个固定延迟或固定键盘高度。

---

## 滚动容器与弹层

### 按平台隐藏滚动条

**原文验证状态：已验证，问题存在；新版 Mpx 已支持支付宝节点级转换。**

滚动条默认显隐与 CSS 隐藏效果在不同宿主、系统和机型间存在差异。原文记录支付宝 Android 的部分机型默认不展示滚动条、iOS 滚动期间展示；微信部分 iOS 机型不能仅靠 CSS 隐藏。这些观察不应推广到所有设备。

**❌ 避免：**将 `show-scrollbar` 限定为仅微信生效，导致支付宝构建无法获得节点级隐藏类；也不要使用全局 `::-webkit-scrollbar` 影响全部滚动容器。

```html
<template>
  <scroll-view scroll-x="{{true}}" show-scrollbar@wx="{{false}}">
    <view class="content">横向滚动内容</view>
  </scroll-view>
</template>
```

**✅ 推荐：**微信单独开启 `enhanced`，`show-scrollbar` 保持跨端布尔写法。微信目标继续使用宿主属性；以微信语法输出支付宝时，Mpx 会在布尔值严格等于 `false` 时为当前节点添加隐藏类，并由 App 全局兼容样式提供节点级规则。

```html
<template>
  <scroll-view
    scroll-x="{{true}}"
    enhanced@wx="{{true}}"
    show-scrollbar="{{false}}"
  >
    <view class="content">横向滚动内容</view>
  </scroll-view>
</template>

<style>
  .content {
    width: 1200rpx;
  }
</style>
```

动态值仅在运行结果为布尔值 `false` 时隐藏；字符串 `"false"`、`undefined`、`null` 和 `0` 均保持宿主默认行为。传入 `true` 只会移除 Mpx 隐藏类，不会强制原本不显示滚动条的宿主或设备显示滚动条。

该规则依赖完整 App 构建的全局样式入口，独立分包、插件产物和单独编译的页面或组件不承诺自动覆盖。Mpx 会转换基础滚动事件名，但不代表两端的 `enhanced`、`refresher-*`、`paging-enabled` 等能力完全等价。仍需在能观察到原始滚动条的目标真机上验证并列、嵌套、横向和纵向滚动，不能用设备本来就不显示滚动条作为隐藏能力的通过依据。

### 将蒙层与可滚动内容拆成兄弟节点

支付宝 `view` 开启 `disable-scroll` 后，会影响其子元素滚动。如果将弹层内的 `scroll-view` 放在禁止滚动的蒙层内部，可能在阻止背景穿透的同时禁用了弹层自身滚动。

**❌ 避免：**给包住全部弹层内容的节点开启 `disable-scroll`。

```html
<template>
  <view class="mask" disable-scroll@ali="{{true}}">
    <view class="dialog">
      <scroll-view scroll-y="{{true}}" class="dialog-scroll">
        <view>弹层内容</view>
      </scroll-view>
    </view>
  </view>
</template>
```

**✅ 推荐：**蒙层负责拦截背景操作，可滚动弹层作为兄弟节点单独布局。微信按原文方案在弹层外层绑定 `catchtouchmove` 空处理函数。

```html
<template>
  <view class="dialog-root" catchtouchmove@wx="stopMove">
    <view class="mask" disable-scroll@ali="{{true}}"></view>
    <view class="dialog">
      <scroll-view class="dialog-scroll" scroll-y="{{true}}">
        <view>弹层内容</view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
  import { createComponent } from '@mpxjs/core'

  createComponent({
    methods: {
      stopMove () {}
    }
  })
</script>

<style>
  .dialog-root {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1000;
  }

  .mask {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.5);
  }

  .dialog {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: #fff;
  }

  .dialog-scroll {
    height: 600rpx;
  }
</style>
```

此结构仍需验证“背景不滚动、内容能滚动”两个目标。地图同层渲染、嵌套滚动、`movable-view` 等场景可能需要结合实际 viewport 尺寸处理局部布局；不要把局部弹层补丁扩展成全局 `page { overflow: hidden }`。

---

## 系统信息与尺寸

### 区分屏幕高度与可用窗口高度

`screenHeight`、`windowHeight`、`statusBarHeight`、`titleBarHeight` 与 `safeArea` 表达的尺寸不同。原文还记录了部分 Android 支付宝真机屏幕尺寸与开发者工具口径不一致的历史案例，不能直接把屏幕高度当成页面可用高度。

**❌ 避免：**将原始 `screenHeight` 直接赋给页面高度，或看到异常就对所有设备统一除以 `pixelRatio`。

```js
const { screenHeight } = mpx.getSystemInfoSync()
this.pageHeight = screenHeight
```

**✅ 推荐：**页面布局优先使用 `getWindowInfo` 返回的 `windowHeight`，并在公共系统信息封装中统一处理能力检测、尺寸校验与必要的兼容逻辑。

```js
import { getWindowInfo } from '@mpxjs/api-proxy'

const windowInfo = getWindowInfo()
this.pageHeight = windowInfo.windowHeight

// safeArea 可能缺失；screenHeight 与 safeArea.bottom 需处于相同坐标和单位口径。
this.safeBottom = windowInfo.safeArea
  ? Math.max(0, windowInfo.screenHeight - windowInfo.safeArea.bottom)
  : 0
```

原文推荐的 `getWindowInfo` 来自**项目公共系统信息封装**，其中包含支付宝 `SDKVersion` 补齐、Android 屏幕尺寸归一、有效性校验、缓存与旧接口回退。该业务封装不等同于上述 `@mpxjs/api-proxy` API：当前仓库的支付宝实现包含能力检测与 `getSystemInfoSync` 回退，但不能据此假设已经覆盖原文全部业务兼容逻辑。

若项目已有该类封装，应统一从公共入口取值。缓存的尺寸在窗口变化后需重新获取；缺失安全区时的 `0` 仅表示示例未增加额外间距，实际设计有安全区要求时应在公共封装中明确处理。

---

## 组件样式隔离

### 通过编译配置或 scoped 隔离组件样式

支付宝没有与微信默认行为完全等价的组件样式隔离。页面和组件中常见的 `.title`、`.left`、`.item` 等类名可能互相影响，跨端后容易出现“组件代码没变，样式却变了”的问题。

**❌ 避免：**依赖微信默认隔离行为，在支付宝目标中无约束地复用通用类名。

```html
<style>
  .title {
    color: red;
  }
</style>
```

**✅ 推荐：**对业务组件目录启用 `autoScopeRules`，或在单个组件的 `style` 上声明 `scoped`。

```js
// 合并到现有 MpxWebpackPlugin 配置中；path 为 Node.js 的 path 模块。
autoScopeRules: {
  include: [path.resolve(__dirname, 'src/components')]
}
```

```html
<template>
  <view class="title">组件标题</view>
</template>

<style scoped>
  .title {
    color: red;
  }
</style>
```

通过 `include` / `exclude` 控制作用范围，按实际配置文件位置解析目录，避免影响依赖全局样式的代码。原文也建议使用 UnoCSS 开发，但使用原子类并不意味着业务中的其他自定义样式自动获得隔离。

配置详情见 [autoScopeRules](../../../docs-vitepress/api/compile.md#autoscoperules)。

---

## 页面配置

### 按编译器能力配置自定义导航栏

微信与支付宝的导航栏配置字段不同。原文基于其版本基准提供了动态 JSON 方案；当前仓库的[页面导航栏文档](../../../docs-vitepress/guide/basic/page.md#ali-custom-navigation)已说明微信 `navigationStyle` 到支付宝的自动转换。选用方案前，应确认项目所用编译器及编译产物是否具备该能力。

**❌ 避免：**将原文“字段可能删除、忽略或报错”的历史结论当作所有版本的现状，或在已有自动转换时重复维护一套等价分支。

**✅ 推荐：**在支持该转换的编译器中，使用微信 JSON 语法统一声明。

```html
<script type="application/json">
{
  "navigationStyle": "custom"
}
</script>
```

当前仓库文档规定，支付宝产物会移除 `navigationStyle`，生成以下字段：

```json
{
  "defaultTitle": "",
  "transparentTitle": "always",
  "titlePenetrate": "YES"
}
```

该转换实现空标题、透明与点击穿透，不代表移除返回按钮等全部宿主导航控件。自定义导航区域仍需处理状态栏、安全区与点击区域。

**旧版本兼容方案：**项目尚不支持上述转换时，按原文思路显式输出目标平台配置；其他平台保持独立分支，不能一律套用支付宝配置。

```html
<script name="json">
  const config = {}

  if (__mpx_mode__ === 'wx') {
    config.navigationStyle = 'custom'
  } else if (__mpx_mode__ === 'ali') {
    config.defaultTitle = ''
    config.transparentTitle = 'always'
    config.titlePenetrate = 'YES'
  }

  module.exports = config
</script>
```

以上为页面配置片段；合入业务页面时保留原有 `usingComponents` 等配置。原文列出的 `navigationBarTextStyle`、`disableSwipeBack`、`backgroundColorTop` / `backgroundColorBottom`、`pageOrientation`、`functionalPages`、`requiredBackgroundModes`、`workers`、`networkTimeout` 等字段也应逐项核对适用层级和目标支持情况，平台插件、隐私与权限声明分别配置。

### 区分禁止页面滚动与关闭纵向回弹

微信的 `disableScroll` 与支付宝的 `allowsBounceVertical` 不是等价配置。原文给出的支付宝方案是关闭纵向回弹，并通过占满页面的固定根容器组织布局；单独设置 `allowsBounceVertical: 'NO'` 不能当作完整的页面滚动锁定。

**❌ 避免：**只把 `disableScroll: true` 换成 `allowsBounceVertical: 'NO'`，保留仍会撑开页面的内容结构。

**✅ 推荐：**对于明确需要固定页面框架的场景，支付宝使用固定根容器，局部可滚动内容放入有明确高度的 `scroll-view`。

```html
<template>
  <view class="page-root">
    <scroll-view class="page-scroll" scroll-y="{{true}}">
      <view>需要滚动的页面内容</view>
    </scroll-view>
  </view>
</template>

<style>
  .page-root {
    height: 100vh;
    /* @mpx-if (__mpx_mode__ === 'ali') */
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    height: auto;
    /* @mpx-endif */
  }

  .page-scroll {
    height: 100%;
  }
</style>

<script name="json">
  const config = {}

  if (__mpx_mode__ === 'wx') {
    config.disableScroll = true
  } else if (__mpx_mode__ === 'ali') {
    config.allowsBounceVertical = 'NO'
  }

  module.exports = config
</script>
```

这会改变页面滚动结构，应结合导航栏、底部安全区和键盘弹起后的实际可用区域验证。只需解决某个弹层穿透时，优先使用局部蒙层方案，不要直接把整个业务页面改成固定布局。下拉刷新属于另一项交互能力，也应独立确认，不能由“关闭回弹”推断为已关闭刷新。

---

## 跨端输出 RN 的补充案例

### 为 iOS 单行文本保留足够行高

**原文验证状态：提供了现象截图与修复样式，未单独标注验证结果。**

原文记录，某些设置了 `numberOfLines="{{1}}"` 的 iOS RN 文本在较小行高下出现顶部裁切，相同配置在 Android、鸿蒙和小程序中的表现可能不同。配图展示了按钮文字与混排文字的异常；仅凭截图不能证明所有字体、设备或 RN 版本都使用同一种裁切规则。

**❌ 避免：**只在小程序中确认文本完整，就认为相同的紧凑行高在 iOS RN 中也足够。

```css
.label {
  font-size: 24rpx;
  line-height: 26rpx;
}
```

**✅ 推荐：**复现裁切后，在 iOS RN 目标下增加行高，并同步检查外层固定高度或裁剪设置是否仍在限制文字。

```css
.label {
  font-size: 24rpx;
  line-height: 26rpx;
  /* @mpx-if (__mpx_mode__ === 'ios') */
  line-height: 32rpx;
  /* @mpx-endif */
}
```

`32rpx` 是原文案例的修复值，不是所有字体的统一最小行高。此处 `__mpx_mode__ === 'ios'` 仅作用于 RN iOS 产物，不会作用于运行在 iPhone 上的微信或支付宝小程序。混排文本的行高分配见 [RN 样式开发最佳实践](../mpx2rn/references/rn-style-practice.md#混排文本-line-height-对齐)。

---

## 历史问题与验证范围

### 自定义组件布局查询不再作为通用限制

原文已删除“支付宝无法直接查询自定义组件布局”的旧结论，并注明支付宝现在会在组件外添加节点，该历史问题已解决。不要为所有自定义组件机械添加一层 `view` 作为测量补丁。

如果旧项目仍出现布局查询异常，应先确认项目版本、查询作用域、节点是否渲染及目标是否正确；只有实际复现并验证有效后，才为该场景增加包装节点。

### 真机验证关注点

原文经验用于定位问题和选择改法，不替代项目自身的验证。涉及宿主渲染行为的改动，至少覆盖微信 / 支付宝与 iOS / Android 的实际目标组合，并记录宿主、基础库、Mpx 版本和机型。

| 场景 | 核心验证目标 |
| --- | --- |
| 文本打点、图片留白 | 长文本确实截断，图片内容尺寸与外部留白符合设计 |
| 输入框与键盘 | 首次聚焦、连续切换、不同键盘类型与收起后布局均正常 |
| 滚动条与弹层 | 滚动条显隐符合预期，背景不穿透，弹层内容仍可滚动 |
| 尺寸与安全区 | 页面使用窗口尺寸，真机数据单位一致，底部内容不被遮挡 |
| 样式隔离 | 父页面与兄弟组件的同名类不会意外改变组件样式 |
| 导航栏与页面滚动 | 编译产物字段正确，导航点击区及页面滚动范围符合设计 |
| iOS RN 文本 | 单行和混排文字完整显示，增加行高后未被外层容器再次裁切 |
