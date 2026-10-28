# 样式基础

本页描述 Mpx 的样式能力与基准用法。Mpx 使用 CSS 语法编写样式，并提供动态样式、预处理与单位转换等能力；具体选择器、属性与布局行为受目标端约束，收录某项能力不代表所有目标端均支持。支付宝的文本截断、图片留白、样式隔离与外部样式类见 [支付宝样式差异](../ali/ali-style-reference.md)。微信 Skyline 的默认值、选择器、属性与渲染行为见 [Skyline 样式差异](../skyline/skyline-style-reference.md)。

## 目录

- [样式规则与选择器](#样式规则与选择器)
- [尺寸单位](#尺寸单位)
  - [rpx 自动转换](#rpx-自动转换)
- [样式引入与作用范围](#样式引入与作用范围)
  - [样式隔离](#样式隔离)
  - [外部样式类](#外部样式类)
- [页面与组件宿主](#页面与组件宿主)
  - [虚拟宿主](#虚拟宿主)
- [平台差异与相关能力](#平台差异与相关能力)

## 样式规则与选择器

在 `.mpx` 的 `<style>` 区块中定义样式，通过模板的 `class` 应用；多个类名用空格分隔，不带 `.`。优先使用类选择器，便于复用与维护。

```html
<template>
  <view class="card muted">提示内容</view>
</template>

<style>
.card {
  padding: 16px;
}
.muted {
  color: #666;
}
</style>
```

Mpx 使用 CSS 选择器匹配模板节点，可用范围按目标端核对。例如，输出微信小程序时，属性选择器（如 `[disabled]`）不生效，不支持带参数的伪类和伪元素选择器。自定义组件还有额外的样式约束，不应仅根据页面中的表现推断组件内也可使用。

## 尺寸单位

- `px` 表示固定 CSS 像素尺寸；`vw` / `rpx` 随页面宽度变化，不按组件容器宽度计算。
- `1vw` 为页面宽度的 `1/100`，`1rpx` 为页面宽度的 `1/750`。例如页面宽度为 `375px` 时，`1vw = 3.75px`，`1rpx = 0.5px`。
- 避免所有尺寸都随屏幕宽度等比放大；适配 PC 等大屏时结合媒体查询等响应式布局方式。
- 样式资源中的 `px → rpx` 转换见 [rpx 自动转换](#rpx-自动转换)。

### rpx 自动转换

通过 `MpxWebpackPlugin.transRpxRules` 可将样式资源中的 `px` 自动转换为 `rpx`，这是 Mpx 的基准能力。该配置不处理模板内联样式中的 `px`；未配置时，`px` 保持原样，`rpx` 仍可正常使用。配置入口见 [配置基准](./config-reference.md#模板与样式配置)。

| 配置 | 行为 |
| --- | --- |
| `include` / `exclude` | 按样式资源路径选取文件；该规则省略 `include` 时默认全部匹配 |
| 规则数组 | 首个命中的规则生效，不叠加后续规则 |
| `mode: 'only'`（默认） | 只转换注释标记的声明或规则块，默认注释为 `/* use rpx */` |
| `mode: 'all'` | 转换匹配文件内的 `px`，默认用 `/* use px */` 排除声明或规则块 |
| `comment` | 自定义标记注释文本 |
| `designWidth` | 设计稿宽度，默认 `750`；例如 `375` 宽设计稿中的 `1px` 会换算成 `2rpx` |

注释放在目标声明前、规则前或规则末尾；规则前与末尾的标记作用于该规则块。例如启用 `mode: 'all'` 后：

```css
.card {
  width: 300px;
  /* use px */
  border-width: 1px;
}
```

此时在默认 `designWidth: 750` 下，宽度转换成 `300rpx`，边框保持 `1px`。显式写出的 `rpx` 不受该注释影响；转换后的 `rpx` 如何渲染或继续换算，由目标端决定。

## 样式引入与作用范围

- 在 `<style>` 中通过 `@import "./common.css";` 引入公共样式，可用于页面与组件间复用。
- `app.mpx` 的样式区块定义应用全局样式。全局只放绝大多数页面都需要的规则，其余按需引入；实际作用范围仍受目标端的隔离规则与配置影响。
- 页面样式用于当前页面；自定义组件还受样式隔离规则约束，不能把全局或页面样式视为必然能命中组件内部节点。
- `.mpx` 区块组织与预处理器入口见 [项目结构与 SFC](./project-structure-and-single-file-component.md)；Mpx 的 scoped 相关配置见 [配置基准](./config-reference.md#模板与样式配置)。

### 样式隔离

样式隔离用于限制页面、组件之间的样式相互影响。微信自定义组件默认隔离，可通过组件的 `options.styleIsolation` / `options.addGlobalClass` 调整；这些原生选项的支持情况需查目标端参考。

Mpx 提供 `<style scoped>`，用于限定样式规则的作用范围；也可以通过编译配置项 [autoScopeRules](./config-reference.md#模板与样式配置) 按资源路径批量启用，在支付宝和 Web 等目标端模拟组件样式隔离。

```html
<style scoped>
.card {
  padding: 24rpx;
}
</style>
```

同文件中可混用 scoped 与普通样式区块，普通区块不受 scoped 限定，仍遵循目标端原有的作用范围。`autoScopeRules` 命中时，该文件的所有样式区块都会启用 scoped。样式是否可从外部进入组件、继承是否生效，需结合目标端判断。

需要由调用方定制组件内部节点时，通过 [外部样式类](#外部样式类) 暴露可定制的节点。

### 外部样式类

组件通过 `externalClasses` 声明接收外部样式的类名，由调用方传入实际样式类，用于定制组件内部节点。声明、模板与调用方保持一致：

1. 在子组件 `createComponent({ externalClasses: [...] })` 中声明名称，不写到 JSON 区块中。
2. 在子组件模板的 `class` 中使用同名占位类。
3. 调用方通过同名属性传入实际样式类，并定义对应样式。

```js
// 子组件脚本
import { createComponent } from '@mpxjs/core'

createComponent({ externalClasses: ['accent-class'] })
```

```html
<!-- 子组件模板 -->
<view class="card accent-class">内容</view>

<!-- 父组件模板，card-item 已在 usingComponents 中注册 -->
<card-item accent-class="accent" />
```

父组件用 `.accent { ... }` 定义样式，即可定制子组件中声明 `accent-class` 的节点。仅在调用方传 `class` 不等同于指定内部节点的外部样式类。

跨端时还需核对 [externalClasses 编译配置](./config-reference.md#模板与样式配置) 与目标端限制，保证编译配置、组件声明、模板占位类和调用属性一致。

## 页面与组件宿主

`page` 选择页面根节点，用于设置页面背景、尺寸等样式；`:host` 选择自定义组件的宿主节点，用于控制组件整体的布局与外观。宿主节点是承载组件的外层节点，与组件模板中的内部节点不同。

```css
/* 页面样式 */
page {
  background-color: #f5f5f5;
}
```

```css
/* 自定义组件样式 */
:host {
  display: flex;
  padding: 16rpx;
}
```

微信小程序中，写在页面样式文件中的 `page` 规则作用于当前页面；跨端后的作用范围、选择器使用位置与宿主布局需查目标端差异。

### 虚拟宿主

虚拟宿主用于移除组件额外的实体宿主包裹节点，使组件内部节点直接参与外部布局。微信组件可在脚本中设置 `options.virtualHost`：

```js
import { createComponent } from '@mpxjs/core'

createComponent({
  options: {
    virtualHost: true
  }
})
```

跨端优先通过编译配置项 [autoVirtualHostRules](./config-reference.md#模板与样式配置) 按组件路径选取需要虚拟化的组件；具体生效方式和模板根节点约束见目标端参考。虚拟化后不再依赖 `:host` 设置布局，应将样式移到实际参与布局的内部节点。

## 平台差异与相关能力

Mpx 样式的最终表现取决于输出目标及其渲染环境，跨端时需核对以下差异：

- 输出微信小程序：基础语义参考 [WXSS 文档](https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxss.html)。WebView 渲染受操作系统内置引擎的 CSS 兼容性影响；Skyline 另有样式限制。
- 输出 Web：查 [Web 样式参考](../web/web-style-reference.md)。
- 输出 RN：先查 [RN 样式实践](../rn/rn-style-practice.md)，属性支持查 [RN 样式参考](../rn/rn-style-reference.md)。
- 样式条件分支：查 [条件编译](./conditional-compile.md#样式条件编译)。
- UnoCSS：查 [原子 CSS 基准](./atomic-css.md)。
