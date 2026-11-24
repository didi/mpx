# 原子 CSS

原子 CSS 是 Mpx 基于 UnoCSS 提供的样式开发能力，可用于小程序、Web 和 RN。本页维护通用接入和基准用法；收录某种写法不代表所有目标端均支持其生成的 CSS。只在项目已启用原子类，或任务涉及 UnoCSS / utility class / atomic CSS 时读取。

输出 Web 时可参考本页基准用法；输出 RN 时，还需额外阅读 [RN 原子 CSS 差异](../rn/rn-atomic-css.md)，了解 RN 的支持范围与使用限制。

## 目录

- [接入配置](#接入配置)
  - [依赖与版本](#依赖与版本)
  - [UnoCSS 配置](#unocss-配置)
  - [注册构建插件](#注册构建插件)
- [模板中使用原子类](#模板中使用原子类)
  - [静态与动态绑定](#静态与动态绑定)
  - [动态生成的类名](#动态生成的类名)
  - [自定义样式值](#自定义样式值)
- [工具类与 Variants](#工具类与-variants)
- [Directives](#directives)
- [Variant Groups](#variant-groups)

## 接入配置

### 依赖与版本

项目需要同时接入：

- `@mpxjs/unocss-plugin`
- `@mpxjs/unocss-base`
- `@mpxjs/webpack-plugin`

三个包保持在兼容的 Mpx 发布线上；具体能力按工程所用版本核对。

### UnoCSS 配置

UnoCSS 66 为 ESM，优先使用 `uno.config.mjs`：

```js
import { defineConfig } from 'unocss'
import presetMpx from '@mpxjs/unocss-base'

export default defineConfig({
  presets: [
    presetMpx({
      baseFontSize: 37.5
    })
  ]
})
```

跨端项目统一使用 `presetMpx()`，不要在业务配置中直接引用 `preset-rn`。

`presetMpx(options?: object): Preset` 接收可选预设配置（默认 `{}`），返回放入 UnoCSS `presets` 数组的预设对象；`baseFontSize?: number` 默认 `37.5`，用于生成样式的 `rem` 换算，其余选项透传给 Wind3 预设。`defineConfig(config)` 接收 UnoCSS 配置对象并返回配置，供配置文件默认导出使用。

### 注册构建插件

- 使用 `@mpxjs/cli@3.x` 且创建项目时已选择原子类：保留脚手架生成的 `mpx.unocss` 配置即可。
- 手动接入：在 webpack 插件列表中注册一个 `MpxUnocssPlugin` 实例，并确保同一编译中已经注册 `MpxWebpackPlugin`。

业务代码不需要 `import 'uno.css'`。

`new MpxUnocssPlugin(options?: object)` 接收插件选项（默认 `{}`），返回放入 webpack `plugins` 数组的插件实例。本文使用的 `transformCSS?: boolean | { applyVariable?: string | string[] }` 和 `transformGroups?: boolean | { separators?: string[] }` 默认均关闭；它们是插件参数，不放入 `presetMpx`。

只有命中插件 `scan` 规则的模板才会扫描并转换 UnoCSS 类名；未命中的模板不会进行特殊类名转义，其中 `wx:class` 对象 key 仍须满足小程序 WXS 标识符限制。

## 模板中使用原子类

### 静态与动态绑定

静态工具类直接写在 `class` 中；条件类继续使用 `wx:class`，不要在 `class` 字符串中拼接 Mustache：

```html
<view
  class="flex items-center gap-2 p-4 bg-white rounded-lg"
  wx:class="{{ [disabled ? 'opacity-50' : '', elevated ? 'shadow-md' : ''] }}"
></view>
```

`wx:class` 对象字面量中的静态 key 同样会被扫描，支持特殊字符类名与 Mpx UnoCSS 插件的 `alias`。例如 `active` 为业务布尔值时：

```html
<view wx:class="{{ { 'text-red-500': active, 'w-[100px]': true } }}"></view>
```

### 动态生成的类名

构建时须能从模板或 safelist 获取完整类名，不能依靠运行时拼接来生成对应 CSS。当类名定义在 JS 的 `data`、`computed` 或其他变量中，或来自接口、外部配置时，模板只绑定变量，插件无法从模板收集到变量中的完整类名。

这些场景统一在 `<template>` 内使用魔法注释 `mpx_config_safelist` 声明所有可能使用的完整类名，多个类名以空格分隔，再通过 `wx:class` 绑定变量；否则未被其他模板或 safelist 收集的类名不会生成对应样式：

```html
<template>
  <!-- mpx_config_safelist: 'text-red-500 text-blue-500' -->
  <view wx:class="{{ [textClass] }}">状态</view>
</template>

<script>
import { createComponent } from '@mpxjs/core'

createComponent({
  data: {
    active: false
  },
  computed: {
    textClass () {
      return this.active ? 'text-red-500' : 'text-blue-500'
    }
  }
})
</script>
```

魔法注释声明当前组件的局部 safelist，只补齐样式收集，动态绑定仍使用 `wx:class`。

### 自定义样式值

当预设的字号、宽度等不能满足需求时，可以在原子类的方括号 `[...]` 中直接填写具体的样式值，这种写法称为 UnoCSS 的“任意值”语法：

```html
<view class="text-[13px] w-[137px] translate-x-[-50%]"></view>
```

上例分别设置 `13px` 字号、`137px` 宽度和向左移动自身宽度 `50%` 的水平位移。

方括号内的值须在构建时确定，完整类名仍需出现在模板或 safelist 中。值必须符合对应样式属性的语法，并受目标端支持范围约束。

## 工具类与 Variants

使用 `presetMpx()` 提供的工具类组合样式；可通过 UnoCSS 的 `rules`、`shortcuts`、`theme` 和 `safelist` 配置扩展或复用。断点、主题、状态等 variants 会生成相应选择器或媒体查询，最终可用性取决于目标端。

颜色可使用斜杠 alpha，例如 `bg-red-500/50`；含 RN 目标时须遵守其独立颜色透明度类限制。不要将 RN 的工具类禁用清单、单类选择器要求或交互伪类限制作为小程序/Web 的通用规则。

- 小程序：以宿主的 CSS、选择器和组件能力为准，不能直接照搬 Web 工具类；例如 SVG 工具类、依赖不支持选择器的工具类不可直接使用。
- Web：结合 [Web 样式差异](../web/web-style-reference.md)及目标浏览器支持情况判断。
- RN：继续读取 [RN 原子 CSS 差异](../rn/rn-atomic-css.md)，核对工具类、variants、directives 与样式值域。

## Directives

Mpx 支持 UnoCSS directives，使用前在 **Mpx UnoCSS 插件选项**中显式开启 `transformCSS`：

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

手动注册 `MpxUnocssPlugin` 时，将相同选项传给插件构造函数。`transformCSS` 也可以传对象配置 directives 的 `applyVariable`。

支持 `@apply`、`--at-apply` / `--uno-apply` / `--uno`、`@screen` 与 `theme()`。apply 变量值包含 `:` 时使用引号包裹完整值。

CSS 中的 `theme(path)` 接收主题键路径字符串（如 `'colors.gray.700'`），在编译时替换为相应主题值；它不是运行时 JS 函数，路径应指向可用于该 CSS 声明的主题值。

```css
.card {
  @apply flex items-center p-4 bg-white;
  color: theme('colors.gray.700');
}

@screen md {
  .card {
    @apply p-6;
  }
}
```

生成的 utility、属性值、选择器与媒体查询仍需符合目标端支持范围。

## Variant Groups

Mpx 支持 UnoCSS variant groups，使用前在 **Mpx UnoCSS 插件选项**中显式开启 `transformGroups`：

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

手动注册 `MpxUnocssPlugin` 时，将相同选项传给插件构造函数。`transformGroups` 也可以传对象配置 `separators`。

分组写法示例：

```html
<view class="md:(p-2 m-2) dark:(bg-slate-900 text-white)"></view>
```

等价于：

```html
<view class="md:p-2 md:m-2 dark:bg-slate-900 dark:text-white"></view>
```

默认支持 `:` 与 `-` 两种分隔符，例如 `font-(bold sans)` 等价于 `font-bold font-sans`。分组只简化书写；展开后的每个 utility 与 variant 都必须处于目标端支持范围内。
