# Mpx2RN 原子 CSS 能力参考

本文档描述 Mpx 跨端输出 RN 时基于 UnoCSS 的原子类接入方式、支持边界与迁移约束。只在项目已启用原子类，或任务涉及 UnoCSS / utility class / atomic CSS 时读取。

## 目录

- [接入配置](#接入配置)
- [模板中使用原子类](#模板中使用原子类)
- [工具类支持范围](#工具类支持范围)
- [Variants 支持范围](#variants-支持范围)
- [颜色透明度约束](#颜色透明度约束)
- [Directives](#directives)
- [Variant Groups](#variant-groups)
- [编译诊断与排查](#编译诊断与排查)
- [检查清单](#检查清单)

---

使用原子类时，以本文档与 [Mpx2RN 样式支持范围](./rn-style-reference.md)为准，不要仅根据 UnoCSS、Tailwind CSS 或 RN 原生样式文档判断。使用不支持的工具类或 variant 会导致编译报错。

## 接入配置

### 依赖与版本

项目需要同时接入：

- `@mpxjs/unocss-plugin`
- `@mpxjs/unocss-base`
- `@mpxjs/webpack-plugin`

使用包含 RN 原子 CSS 能力的版本，并让三个包保持在兼容的 Mpx 发布线上，不要只升级其中一个包。

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

### 注册构建插件

- 使用 `@mpxjs/cli@3.x` 且创建项目时已选择原子类：保留脚手架生成的 `mpx.unocss` 配置即可。
- 手动接入：在 webpack 插件列表中注册一个 `MpxUnocssPlugin` 实例，并确保同一编译中已经注册 `MpxWebpackPlugin`。

业务代码不需要 `import 'uno.css'`。

## 模板中使用原子类

### 静态与动态绑定

静态工具类直接写在 `class` 中；条件类继续使用 `wx:class`，不要在 `class` 字符串中拼接 Mustache：

```html
<view
  class="flex items-center gap-2 p-4 bg-white rounded-lg"
  wx:class="{{ [disabled ? 'opacity-50' : '', elevated ? 'shadow-md' : ''] }}"
></view>
```

### 任意值

RN 构建支持在 Mpx2RN 样式能力范围内的 UnoCSS 任意值，例如：

```html
<view class="text-12px bg-#fff/10 translate-x-[-50%]"></view>
```

任意值最终仍受 RN 样式属性和值域约束；能被 UnoCSS 识别不代表一定能通过 Mpx2RN 编译。

### 动态生成的类名

模板中必须出现完整类名。不要通过字符串片段拼出类名：

```html
<!-- Bad：不要动态拼接类名 -->
<view class="text-{{color}}-500"></view>
```

改为完整类名映射，或把所有可能值加入 `uno.config.mjs` 的 `safelist`：

```js
export default defineConfig({
  presets: [presetMpx()],
  safelist: ['text-red-500', 'text-blue-500']
})
```

## 工具类支持范围

以下表格用于快速筛查。涉及具体属性和值时，继续对照 [跨端输出 RN 样式能力参考](./rn-style-reference.md)；两者均支持才可使用。

| 分类 | 支持情况 | 关键边界 |
| --- | --- | --- |
| Typography | 部分支持 | 支持常用字体、字号、字重、行高、字间距、文本对齐/颜色/装饰/阴影/转换；不支持 `white-space`、word break、text indent、text stroke、font variant numeric 等 |
| Flexbox | 支持 | 支持 `flex`、direction、wrap、basis、grow、shrink 及常用 align/justify；不支持 `inline-flex`，部分 justify/place/item/self 规则不支持 |
| Position / sizing | 部分支持 | 支持 `relative`、`absolute`、top/right/bottom/left、z-index、宽高及 min/max；Box Sizing 支持 `box-border`、`box-content`；不支持 `sticky`、float、clear、isolation |
| Spacing / gap | 部分支持 | 支持 margin、padding 与 flex gap；不支持 `space-x-*` / `space-y-*`、grid gap |
| Background / gradient | 部分支持 | 支持颜色、透明度、position、size、image、linear gradient；repeat 仅支持 `no-repeat`，不支持 attachment、clip、origin、blend mode |
| Border / outline | 部分支持 | 支持常用圆角、宽度、颜色、透明度、style 与 outline；不支持 logical border、`double`、`hidden` 等值 |
| Shadow / opacity | 支持 | 支持 box shadow、shadow color 与 opacity；颜色 alpha 写法遵循下文约束 |
| Transform | 支持 | 支持 origin、rotate、scale、skew、translate、perspective |
| Transition | 部分支持 | 支持单属性及逗号分隔的多属性 transition，以及对应的 duration、timing function、delay；每个属性都必须处于 Mpx2RN transition 支持范围内；RN preset 会屏蔽 `transition`、`transition-\d+`、`transition-all`、`transition-all-\d+` |
| Filter | 有条件支持 | 依赖 RN 0.76+，并存在机型兼容性差异；上线前必须覆盖目标 RN 版本和设备验证 |
| Overflow | 部分支持 | 仅使用 `hidden`、`scroll`、`visible` |
| Display | 部分支持 | 支持 `hidden`；不要使用 `block`、`inline`、`inline-block`、`contents` 等 Web display 工具类 |
| Interactivity | 少量支持 | pointer events 仅 `auto` / `none`，user select 支持 `none` / `auto` / `all` / `text`；其余多数规则不支持 |

以下类别默认不要使用：

- Grid、columns、container、table、divide、ring、line-clamp
- animation、view-transition
- SVG utilities、screen reader utilities
- backdrop filter、mix/background blend mode
- placeholder、list style、overscroll、scroll behavior、touch action、cursor、caret、resize、will-change

不要用多个原子类拼接出 RN 不支持的底层 CSS。原子类只简化书写，不会扩展 Mpx2RN 的样式能力上限。

## Variants 支持范围

### 支持

- 屏幕断点：`sm:`、`md:`、`lg:`、`xl:`、`2xl:`，以及 `<sm:`、`@sm:` 等对应形式。
- 主题：`dark:`、`light:`。
- 方向：`portrait:`、`landscape:`。
- 交互：仅 `hover:`，并且只应使用在支持 `hover-class` / hover style 的 Mpx 内建组件上。
- important：`!utility` / `important:`；仅在普通原子类无法满足覆盖需求时使用。

### 不支持

不要使用会生成复合选择器、父子关系或 RN 无法表达状态的 variants，例如：

- `active:`、`focus:`、`visited:` 等非 hover 伪类
- child / sibling / combinator variants
- aria / data attribute variants
- container query、supports、scope、CSS layer variants
- placeholder、motion、contrast、space/divide 等 variants

使用这些 variant 会直接产生编译错误，不会降级为普通工具类。

## 颜色透明度约束

颜色透明度统一使用斜杠 alpha 语法，不要组合颜色工具类与独立 opacity 工具类：

| 不要使用 | 使用斜杠 alpha 语法 |
| --- | --- |
| `bg-red-500 bg-opacity-50` | `bg-red-500/50` |
| `text-blue-600 text-opacity-30` | `text-blue-600/30` |
| `border-gray-300 border-opacity-50` | `border-gray-300/50` |
| `shadow-black shadow-opacity-20` | `shadow-black/20` |

斜杠 alpha 语法在 Web 与 RN 端一致，也是跨端项目的统一写法。

## Directives

Mpx2RN 支持 UnoCSS directives，使用前在 **Mpx UnoCSS 插件选项**中显式开启 `transformCSS`：

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

Mpx2RN 已确认支持以下形式：

| 写法 | 支持情况 | RN 边界 |
| --- | --- | --- |
| `@apply ...` | 支持 | 其中的 utility 必须在 Mpx2RN 支持范围内 |
| `--at-apply`、`--uno-apply`、`--uno` | 支持 | 与 `@apply` 相同；值包含 `:` 时使用引号包裹完整值 |
| `@screen <breakpoint>` | 支持 | 仅使用 `min-width` / `max-width`、`and` 与 `px` 单位媒体查询 |
| `theme('path')` | 支持 | 解析出的属性值必须处于 Mpx2RN 支持值域内 |

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

使用 directives 时注意：

- `@apply` 中使用的 variants 仍以本文档的 [Variants 支持范围](#variants-支持范围)为准。
- 自定义 `theme.breakpoints` 应使用 `px`；`@screen` 不支持其他媒体特性。
- 不要使用 `@layer` 等非 `@media` 的 at-rule。
- `icon()` 依赖额外 preset 与背景图产物，当前未纳入 Mpx2RN 原子 CSS 的保证范围。

## Variant Groups

Mpx2RN 支持 UnoCSS variant groups，使用前在 **Mpx UnoCSS 插件选项**中显式开启 `transformGroups`：

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
<view class="md:(p-2 m-2) hover:(bg-blue-500 text-white)"></view>
```

等价于：

```html
<view class="md:p-2 md:m-2 hover:bg-blue-500 hover:text-white"></view>
```

默认支持 `:` 与 `-` 两种分隔符，例如 `font-(bold sans)` 等价于 `font-bold font-sans`。分组只是书写简化，不会扩大 RN 能力；其中的每个 utility 与 variant 都必须处于本文档标注的支持范围内。

## 编译诊断与排查

### 使用了不支持的工具类

典型错误包含：

```text
[Mpx Unocss]: all those '...' class utilities is not supported in react native mode
```

处理方式：

1. 在本参考的支持范围中确认所属类别。
2. 用受支持的 Flex、spacing、颜色、transform 等工具类重写。
3. 若无法等效实现，使用模板或文件级条件编译为 RN 与原平台分别提供实现。

不要通过自定义 rule 强制放开不支持的工具类，应改用本文档列出的支持写法。

### 自定义 rule 生成失败

自定义 UnoCSS rule 还需满足：

- 只生成 Mpx2RN 支持的 CSS 属性和值。
- 选择器最终为单类选择器；仅受支持的 `hover` 可形成单类 + pseudo。
- at-rule 仅使用 Mpx2RN 可转换的 `@media`。
- 不生成依赖 DOM 层级、伪元素或 Web 布局模型的 CSS。

出现 `Only single class selector is supported`、`Only @media rule is supported` 或 `[Mpx style error]` 时，按生成后的 CSS 定位，不要只检查模板 className。

### 类名存在但无样式

依次检查：

1. 类名是否通过字符串片段拼接；改为模板中的完整类名或加入 `safelist`。
2. 工具类或 variant 是否在 RN 支持范围内。
3. 是否使用了独立的 `*-opacity-*` 颜色透明度类。
4. 是否被组件局部样式覆盖。
5. 自定义 rule 是否生成了 RN 不支持的属性、值、选择器或 at-rule。

## 检查清单

- [ ] `@mpxjs/unocss-plugin`、`@mpxjs/unocss-base`、`@mpxjs/webpack-plugin` 版本兼容。
- [ ] UnoCSS 配置使用 `presetMpx()`，未直接使用 `preset-rn`。
- [ ] 未手动引入 `uno.css`。
- [ ] 动态类使用完整 token 或 `safelist`，未拼接类名片段。
- [ ] 使用 directives / variant groups 时已显式开启 `transformCSS` / `transformGroups`。
- [ ] variant group 展开后的所有 utility 与 variant 均在 RN 支持范围内。
- [ ] directives 中只使用 RN 支持的 utility、属性、值、选择器和媒体查询。
- [ ] 所有工具类及其底层 CSS 均在 RN 支持范围内。
- [ ] 仅使用 RN 支持的 variants；交互 variant 仅使用 `hover:`。
- [ ] 颜色透明度使用 `color/alpha`，未使用独立 `*-opacity-*` 组合。
- [ ] filter 已按目标 RN 版本与设备验证。
- [ ] 构建中不存在 `[Mpx Unocss]`、`[Mpx style error]` 或相关 warning。
