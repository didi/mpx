---
name: mpx2web
description: Mpx 跨端输出 Web（简称 Mpx2Web）的开发适配指南，覆盖模板、脚本、样式、JSON 配置四大维度，以及路由部署、SEO/SSR、H5 生态混合开发等 Web 专属能力。当用户要求对已有 Mpx 组件进行 Web 跨端适配改造、创建符合 Web 跨端兼容规范的 Mpx 组件、排查 Mpx2Web 编译报错或查询某项能力（模板指令、基础组件、样式属性、生命周期、环境 API、JSON 字段、路由/部署等）在 Web 平台的支持情况时强制调用。当用户问题不涉及 Mpx 跨端输出 Web 时不应调用，如小程序原生开发问题、纯前端 Vue 开发问题、RN 端适配问题等。
metadata:
  version: "1.0.0"
  author: wangcuijuan
---

# Mpx 跨端输出 Web 开发与适配指南

## 背景介绍

Mpx 是一个以微信小程序语法为基础、进行了类 Vue 语法拓展支持的跨端开发框架，支持将同一套代码输出到小程序（微信、支付宝、百度等）、Web 和 React Native 平台。其中 **Web（`mode === 'web'`）是 Mpx 起步最早、能力最完整、与小程序原平台语义最接近的输出端**：编译产物基于 **Vue 2.7**，经 webpack / vue-loader 生成真实 DOM 应用，绝大多数小程序模板、样式、逻辑写法可直接等效运行。

正因为 Web 兼容度高，本 SKILL 的核心**不是**罗列"Web 不支持什么"的长清单，而是聚焦三类真正需要处理的问题：

1. **小程序专属能力在 Web 的降级 / 缺失**（如 `onShareAppMessage`、`open-data`、部分依赖原生硬件的 API/组件）。
2. **Web 独有且必须正确配置的能力**（路由模式与部署路径、`rpx` 单位换算、SEO/SSR、移动端适配）。
3. **跨平台兼容约束**：产物须在原平台与 Web 平台均能正常运行，避免引入只在 Web 生效、却破坏小程序原平台的写法。

本 SKILL 面向以下两类任务：

1. **任务一**：对已有的 Mpx 组件进行 Web 跨端适配改造（已基于小程序规范编写、需补齐 Web 兼容性）。
2. **任务二**：从零创建一个符合 Web 跨端兼容规范的 Mpx 组件。

## Mpx 单文件组件（SFC）结构

Mpx 页面/组件以 `.mpx` 为扩展名，将视图、逻辑、样式、配置封装在一个文件中，由以下区块组成（对应小程序的 wxml/js/wxss/json 四个文件）：

- `<template>`：视图模板，微信小程序基础模板语法 + Mpx 的类 Vue 指令（如 `wx:if`、`wx:for`、`wx:model` 等）。
- `<script>`：组件逻辑，支持选项式与组合式 API（`@mpxjs/core` 的 `createComponent` / `createPage` / `ref` / `computed` 等）。
- `<style>`：样式，支持 Stylus / Sass / Less 等预处理器。
- `<script type="application/json">`：JSON 配置，如 `usingComponents` 组件注册等。

最小示例：

```html
<template>
  <view class="container">{{ title }}</view>
</template>

<script>
  import { createComponent, ref } from '@mpxjs/core'
  createComponent({
    setup () {
      const title = ref('hello world')
      return { title }
    }
  })
</script>

<script type="application/json">
  { "usingComponents": {} }
</script>

<style lang="stylus">
  .container
    flex 1
</style>
```

上述四个区块在 Web 输出下的具体跨端能力与差异，分别见下方知识库索引中的模板 / 脚本 / 样式 / JSON 能力参考。

## 知识库索引

| 知识库 | 说明 |
| --- | --- |
| [条件编译](./references/conditional-compile.md) | 模板、脚本、样式、JSON 等不同部分的条件编译语法，遇到无法跨端等效实现需分平台处理时读取 |
| [跨端输出 Web 模板能力参考](./references/web-template-reference.md) | 模板部分跨端能力详情：数据绑定、模板指令、事件、Slot、WXML 模板、i18n、无障碍访问、基础组件清单及其属性/事件在 Web 的支持与降级情况 |
| [跨端输出 Web 脚本能力参考](./references/web-script-reference.md) | 脚本部分跨端能力详情：构造选项、生命周期、实例方法/属性、组合式 API、运行时导出、状态管理 |
| [跨端输出 Web 样式实践](./references/web-style-practice.md) | Web 样式差异与实践：`rpx` 换算、移动端适配、安全区域、固定定位、Web 专属 CSS 隔离 |
| [跨端输出 Web 环境 API 参考](./references/web-api-reference.md) | `@mpxjs/api-proxy` 提供的环境 API 在 Web（H5 实现）的支持情况，涉及网络、存储、界面、设备、媒体、位置等及其浏览器限制 |
| [跨端输出 Web JSON 配置参考](./references/web-json-reference.md) | 应用、页面、组件三层 JSON 配置在 Web 平台的支持范围与差异（含 `tabBar`、分包、路由与 SSR 相关配置） |
| [Mpx 与 H5 生态混合开发](./references/web-hybrid-dev.md) | 在 `.mpx` 内使用原生 DOM、第三方 H5 SDK / Vue 组件的方式与跨端隔离方案 |

### 知识库使用建议

参考文档体量较大，**不要一次性预读全部参考**，按需取用即可：

1. **入口只读本 SKILL.md**：完整读完本文档（含下方通用约束与任务流程）足以覆盖大多数常见场景的判断；不要在动笔前预读 references 目录。
2. **触发式读取**：只在任务流程或通用约束中**明确指向**某份参考时读取，且仅读取与当前问题相关的小节（参考文档均含目录与章节锚点，使用 grep / 锚点跳读，不要整文件 Read）。
3. **典型任务的最小阅读集**（仅当本 SKILL.md 已无法判断时再补充）：
   - 已有组件 Web 跨端适配改造：Web 兼容度高，多数情况无需改动模板/样式主体；识别问题维度后再读对应能力参考的相关小节（如 API 降级查 `web-api-reference.md`、单位/适配查 `web-style-practice.md`）。
   - 新建 Web 跨端兼容组件：先按本 SKILL.md 的通用约束起手，遇到能力存疑（某 API 是否存在、某组件是否降级）时再点查对应参考。
   - 排查特定编译报错：直接定位到报错维度的能力参考相关小节。

## 通用约束与适配原则

无论是适配改造还是新建组件，跨端兼容均需严格遵循以下通用约束。**Web 输出与小程序原平台语义高度一致，几乎不需要为兼容而改写小程序原有写法，约束主要集中在"小程序专属能力在 Web 的降级"与"Web 专属能力的正确配置"两侧。**

### 跨平台兼容约束

产物代码须在原平台（小程序）与 Web 平台均能正常运行。引入「Web 支持但小程序不支持」的写法（如直接使用 DOM API、`window` 对象、第三方 H5 SDK 等）时，**不要替换小程序已有写法**，而应：

- 用条件编译将该 Web 写法限定在 Web 平台输出（模板属性后缀 `@web`、样式与脚本 `@mpx-if` 包裹等）；
- 同步用条件编译保留小程序原有写法，避免改造引入小程序行为退化。

该原则贯穿模板 / 脚本 / 样式 / JSON 四个维度。

### 模板（template）约束

1. **基础组件优先**：使用 [模板能力参考 · 基础组件](./references/web-template-reference.md#基础组件) 中标注 Web 支持的基础组件与其支持属性/事件。多数小程序基础组件在 Web 有等效实现，但少数**依赖原生硬件或小程序开放能力**的组件（如 `camera` / `live-player` / `live-pusher` / `open-data` / `official-account` / `ad` 等）在 Web 不支持或仅部分降级，需查参考确认；`web-view` 在 Web 渲染为 `iframe`，行为与小程序有差异。
2. **页面滚动**：Web 页面默认可滚动，`onPageScroll` / `onReachBottom` / `onPullDownRefresh` 等页面滚动相关生命周期在 Web **支持**（由 Mpx Web 运行时实现，行为与小程序对齐）；具体差异见 [脚本能力参考 · 生命周期](./references/web-script-reference.md#生命周期)。
3. **模板内方法调用**：跨端通用约束下，模板 Mustache 表达式应避免普通方法调用，需通过 `computed` / `wxs` 实现（i18n 翻译函数除外），以保持与其他平台一致。
4. **i18n**：组合式 API 中 `useI18n()` 解构出的翻译函数须以原名 `t` / `tc` / `te` / `tm` 暴露至模板的 `return`，禁止重命名。
5. **事件传参**：传递自定义参数给事件处理器时，优先使用事件内联传参语法（如 `bindtap="handleTap('param')"`），而不是通过 `data-` dataset 属性传参，以保持跨端一致。
6. **对象字面量 key 禁止加引号**：在模板插值（`wx:style` / `wx:class` 等）中使用对象字面量时，key **不允许**使用单引号或双引号包裹，否则会导致微信小程序模板编译报错。应使用 camelCase 形式的无引号 key。
   - **Bad Example**: `wx:style="{{{'background-image': '...'}}}"`
   - **Good Example**: `wx:style="{{{backgroundImage: '...'}}}"`
7. **文字使用 `text` 包裹**：保持与小程序及其他端一致，文字内容优先使用 `text` 组件显式包裹，避免依赖平台隐式行为。

### 脚本（script）约束

1. **生命周期 / 构造选项**：仅使用 [脚本能力参考](./references/web-script-reference.md) 中标注 Web 支持的生命周期与构造选项；小程序专属的分享与 tab 相关生命周期（`onShareAppMessage` / `onShareTimeline` / `onAddToFavorites` / `onTabItemTap` 等）在 Web 无等效，须用条件编译隔离或确认可降级。
2. **环境 API**：通过 `@mpxjs/api-proxy` 提供的统一 `mpx.xxx` API 调用环境能力，避免直接使用 `wx.xxx` / `my.xxx`；Web 端由 api-proxy 映射为 H5 实现，部分依赖原生硬件的能力（蓝牙、NFC、部分传感器等）受浏览器限制不可用或需降级，具体支持范围见 [环境 API 参考](./references/web-api-reference.md)；如用户通过 `custom` 配置扩充拓展了环境 API 能力，以用户说明为准。
3. **路由跳转统一使用 Mpx 导航 API**：Mpx 自带一套与微信小程序对齐的跨端路由逻辑，页面跳转统一使用 `mpx.navigateTo` / `mpx.redirectTo` / `mpx.switchTab` / `mpx.navigateBack` / `mpx.reLaunch`（编译到 Web 时由 Mpx 内部映射到 Web 路由）。**禁止在 `.mpx` 中直接引入 `vue-router` 或手写 Web 路由跳转**，以免破坏跨端一致性。详见 [环境 API 参考](./references/web-api-reference.md)。
4. **直接使用浏览器能力须隔离**：直接访问 `window` / `document` / DOM、第三方 H5 SDK 等仅 Web 可用的能力时，必须用条件编译限定在 Web 平台，并保留小程序侧等效逻辑，详见 [H5 生态混合开发](./references/web-hybrid-dev.md)。
4. **selector API**：`selectComponent` / `createSelectorQuery` 等在 Web 的 selector 语法与微信小程序保持一致（ID、class、子元素 `>`、后代、跨组件后代 `>>>`、并集 `,` 等），直接基于真实 DOM 查询即可。详见 [脚本能力参考 · 实例方法与属性](./references/web-script-reference.md#页面--组件实例方法与属性)。

### 样式（style）约束

> **样式兼容度**：Web 基于真实 CSS 引擎，小程序中使用的复合选择器、伪类、伪元素、`grid` / `float`、媒体查询等 CSS 写法在 Web 均可直接使用，**无需为兼容而改写**。Web 样式约束主要集中在 `rpx` 单位换算与移动端适配。

1. **样式能力判断口径**：Web 基于真实 CSS 引擎，绝大多数 CSS 属性与选择器可直接使用，无需逐项兼容改造；差异点见 [Web 样式实践](./references/web-style-practice.md)。
2. **`rpx` 单位换算**：Web 端 `rpx` 默认会换算为视口单位 `vw`（以 750rpx 对应 100vw 为基准），详见 [Web 样式实践 · 单位与适配](./references/web-style-practice.md#单位与适配)。
3. **优先使用模板指令进行动态样式绑定**：使用 `wx:class` / `wx:style` 指令，避免在 `class` / `style` 属性内拼接 `{{}}` 插值表达式（跨端通用约束）。
   - **Bad Example**: `<view class="item {{isActive ? 'active' : ''}}">`
   - **Good Example**: `<view class="item" wx:class="{{ {active: isActive} }}">`
4. **保留单位注释**：保留原始样式中的 `/*use rpx*/` 与 `/*use px*/` 注释，编译期会据此批量切换样式单位。
5. **Web 专属写法须隔离**：若使用仅 Web 生效、小程序不支持的 CSS（如 `::-webkit-scrollbar` 伪元素、`vh`/`vw` 视口单位等），按需用样式条件编译隔离，并保留小程序侧等效写法，避免破坏原平台。常见兼容方案见 [Web 样式实践](./references/web-style-practice.md)。

### JSON 配置约束

1. **支持范围**：应用、页面、组件三级 JSON 配置在 Web 平台的字段支持详情见 [JSON 配置参考](./references/web-json-reference.md)。小程序中常用的 `tabBar` 在 Web **支持**（Mpx 渲染等效 tabbar）；但部分小程序专属字段（如 `workers`、`plugins`、云开发相关）在 Web 不支持，须通过条件编译隔离。
2. **路由与 SSR 相关配置**：`pages`、`subPackages`、页面 `navigationBar*`、`webConfig.routeConfig`、`webConfig.useSSR` 等在 Web 有对应行为，详见 [JSON 配置参考](./references/web-json-reference.md)。
3. **动态生成配置**：当需要分平台或分环境定义 JSON 配置时，使用 `<script name="json">` 形式访问 `__mpx_mode__` / `__mpx_env__` 变量动态生成。

### 条件编译约束

当某项能力无法在 Web 平台等效实现，或需引入 Web 专属能力时，使用条件编译进行分平台处理：

- 小程序原平台条件：`__mpx_mode__ === 'wx' || __mpx_mode__ === 'ali'`（按项目实际目标小程序补充 `swan`/`qq`/`tt`/`jd`）
- Web 平台条件：`__mpx_mode__ === 'web'`
- 如同时维护 RN，请额外覆盖 `ios` / `android` / `harmony`

需遵循以下约束：

1. **最小化使用**：条件编译是处理跨端不兼容的**最后手段**，不是首选方案。Web 兼容度高，多数能力无需条件编译；使用前应先确认是否存在无需条件编译的跨端兼容写法。需要时仅最小包裹真正不兼容的片段，不要整段代码都用条件编译分叉。
2. **避免空选择器**：样式条件编译产物中不得留下空选择器（无样式内容的选择器），整条规则（含选择器与花括号内容）须一并被条件编译包裹。详见 [条件编译 · 避免产物中出现空选择器](./references/conditional-compile.md#避免产物中出现空选择器)。
3. **缩进敏感预处理器（stylus / sass 等）中条件编译注释须与所在块体同级缩进**：mpx 会将指令注释和未命中分支替换为等长占位注释，占位注释保留原缩进。指令注释若顶格写在缩进块内部，会截断块上下文，触发 `expected "indent", got "outdent"` 等解析错误。
4. **各区块使用对应的条件编译语法**：样式条件编译使用 `/* @mpx-if (__mpx_mode__ === ...) */` 注释语法；模板条件编译使用 `wx:if="{{__mpx_mode__ === ...}}"` 指令或 `@mode` / `@_mode` 属性后缀；脚本和 JSON 配置条件编译使用 `if (__mpx_mode__ === ...)` 条件语句，**避免误用**，详情参考 [条件编译](./references/conditional-compile.md)。

## 任务一：对已有 Mpx 组件进行 Web 跨端适配改造

### 输入

基于小程序技术规范编写的 `{name}.mpx` 组件（已在小程序平台运行，但未适配 Web）。

### 输出

以用户指示为准；若无特殊指示则默认在原文件 `{name}.mpx` 中进行修改。输出修改后代码时应输出完整组件代码，避免使用省略号，确保用户可以直接复制或应用修改。

> **提示**：Web 兼容度高，大量小程序组件无需任何改动即可输出 Web。改造前先快速判断是否真的存在不兼容点（多为小程序专属 API / 组件、或需要 Web 专属能力），避免无谓改写。

### 任务流程

#### 1. 模板（template）适配改造

- 读取 [模板能力参考](./references/web-template-reference.md)，重点核对是否使用了在 Web **不支持或降级**的基础组件（`camera` / `live-*` / `open-data` 等）及其属性/事件；常规组件无需改动。
- 检查动态 `class` / `style` 是否使用了 `{{}}` 拼接字符串，统一改造为 `wx:class` / `wx:style` 指令绑定（跨端通用规范）。
- 对于无法等效实现的部分使用 [模板条件编译](./references/conditional-compile.md#模板条件编译)（`@mode` / `@_mode` / `mpxTagName@mode`）进行平台隔离，并添加 `todo` 注释记录差异原因。

#### 2. 脚本（script）适配改造

- 读取 [脚本能力参考](./references/web-script-reference.md) 与 [环境 API 参考](./references/web-api-reference.md)，核对生命周期、构造选项、实例方法与环境 API 在 Web 的支持情况，重点关注小程序专属能力（分享、tab、原生硬件 API）。
- 平台直连 API（如 `wx.xxx` / `my.xxx`）统一替换为 `mpx.xxx` 接入 `@mpxjs/api-proxy` 抹平的实现。
- 路由跳转保持使用 `mpx.navigateTo` 等统一导航 API，不要替换为 `vue-router`；若存在直接引入 `vue-router` 的写法，改回 Mpx 导航 API。
- 直接使用 `window` / `document` / 第三方 H5 SDK 的 Web 专属逻辑，用 [脚本条件编译](./references/conditional-compile.md#脚本条件编译) 限定在 Web 平台，并保留小程序侧等效逻辑，添加 `todo` 注释记录差异原因。

#### 3. 样式（style）适配改造

- Web 支持完整 CSS，**通常无需对选择器或常规样式属性进行兼容改造**。
- 读取 [Web 样式实践](./references/web-style-practice.md) 确认 `rpx` 换算与移动端适配口径符合工程配置。
- 仅对"Web 专属、小程序不支持"或"小程序专属、Web 无等效"的样式片段，用 [样式条件编译](./references/conditional-compile.md#样式条件编译) 对**整条规则**进行最小包裹，添加 `todo` 注释记录差异原因。

#### 4. JSON 配置适配改造

- 读取 [JSON 配置参考](./references/web-json-reference.md)，检查所用字段在 Web 的支持情况，重点关注小程序专属字段（`workers` / `plugins` / 云开发等）。
- 对于平台差异较大的配置项，将 JSON 区块改写为 `<script name="json">` 形式，借助 `__mpx_mode__` 进行 [配置条件编译](./references/conditional-compile.md#配置条件编译)。

#### 5. 编译校验

完成上述改造后，使用本 skill 自带的编译校验脚本对修改后的 `.mpx` 文件进行真实编译校验（位于 skill 目录下的 `scripts/compile-validate.js`，**不在宿主项目根目录下**），参见下文 [编译校验脚本](#编译校验脚本)。若校验失败，按错误分类回到对应步骤进行修正。

#### 6. 检查与确认

按 SFC 各区块逐项核对，并确认条件编译与编译校验已收尾：

**跨平台兼容**
- [ ] 引入的「Web 支持但小程序不支持」的写法均已通过条件编译限定在 Web 输出；小程序原有写法已用条件编译保留，未因 Web 适配而被替换或删除。

**模板（template）**
- [ ] `<template>` 中使用的基础组件、属性、事件均在 [模板能力参考](./references/web-template-reference.md) 标注为 Web 支持，或已通过模板条件编译进行平台隔离。
- [ ] 动态 `class` / `style` 已改造为 `wx:class` / `wx:style` 指令，未在属性值内使用 `{{}}` 拼接。
- [ ] `wx:class` / `wx:style` 等模板插值中的对象字面量 key 均未使用引号包裹，使用 camelCase 无引号形式。

**脚本（script）**
- [ ] `<script>` 中使用的生命周期、构造选项、实例方法与环境 API 均在 [脚本能力参考](./references/web-script-reference.md) 与 [环境 API 参考](./references/web-api-reference.md) 标注为 Web 支持，或已通过脚本条件编译进行平台隔离。
- [ ] 平台直连 API（`wx.xxx` / `my.xxx`）已统一替换为 `mpx.xxx`；路由跳转使用 `mpx.navigateTo` 等统一导航 API，未直接引入 `vue-router`；直接访问 `window` / `document` / 第三方 H5 SDK 的逻辑已用条件编译限定在 Web 平台。

**样式（style）**
- [ ] `<style>`、`<template>`、`<script>` 中的样式写法符合 [Web 样式实践](./references/web-style-practice.md)，Web 专属且小程序不支持的样式已通过样式条件编译隔离。
- [ ] `/*use rpx*/` / `/*use px*/` 单位注释已保留；`rpx` 换算与移动端适配符合工程配置。

**JSON 配置**
- [ ] `<script type="application/json">` / `<script name="json">` 中使用的字段均在 [JSON 配置参考](./references/web-json-reference.md) 标注为 Web 支持，或已通过配置条件编译进行平台隔离。

**条件编译**
- [ ] 不存在大面积连续条件编译，仅最小包裹不兼容片段。
- [ ] 样式条件编译处理后产物中不存在空选择器。
- [ ] 各个区块内的条件编译语法都符合规范，不存在误用（如在模板区块中使用 `/* @mpx-if */` 注释语法等）。

**本地校验**
- [ ] 通过 [编译校验脚本](#编译校验脚本) 真实编译校验（建议 `--target=web` 与小程序目标一并校验，确保跨端兼容）。
- [ ] 通过本地环境 ESLint 校验（如 `npx eslint path/to/component.mpx`），无 lint 错误与警告。

## 任务二：创建符合 Web 跨端兼容规范的 Mpx 组件

### 输入

用户描述的组件需求，包括视图结构、交互、数据来源、目标平台范围、是否需要复用 H5 原生能力 / 第三方 SDK 等。

### 输出

完整的 `{name}.mpx` 组件文件，结构包含 `<template>`、`<script>`、`<style>` 与 JSON 配置区块。代码须直接满足 [通用约束与适配原则](#通用约束与适配原则)，避免新建后再走一轮适配改造。

### 任务流程

#### 1. 设计阶段

- 与用户对齐需求要点：组件视图结构、props / 事件、数据流、目标平台、是否需要 Web 专属能力（路由、SEO/SSR、第三方 H5 SDK）。
- 若需要复用 H5 原生能力或第三方库，读取 [H5 生态混合开发](./references/web-hybrid-dev.md)，对差异片段用局部条件编译（`@mode` / `@_mode` / `mpxTagName@mode` 或脚本 `__mpx_mode__`）隔离 Web 专属属性或少量节点即可。

#### 2. 实施阶段

按 SFC 四个区块依次实现，全程遵循 [通用约束与适配原则](#通用约束与适配原则)：

- **`<template>`**：读取 [模板能力参考](./references/web-template-reference.md)，避开 Web 不支持/降级的基础组件；动态样式类名绑定使用 `wx:class` / `wx:style`。
- **`<script>`**：读取 [脚本能力参考](./references/web-script-reference.md) 与 [环境 API 参考](./references/web-api-reference.md)，统一通过 `mpx.xxx` 调用环境能力。
  - **优先使用组合式 API**：新建组件优先使用 `<script setup>` 风格的组合式 API 编写逻辑，生命周期须在 `<script setup>` 顶层同步注册，详见 [脚本能力参考 · 组合式 API](./references/web-script-reference.md#组合式-api)。
  - **状态管理优先使用 `@mpxjs/pinia`**：新项目、新状态域或与组合式 API 协同时，使用 `@mpxjs/pinia`（Pinia 风格）；仅当工程已深度使用 `@mpxjs/store`（Vuex 风格）时继续维护沿用。详见 [脚本能力参考 · 状态管理](./references/web-script-reference.md#状态管理)。
- **`<style>`**：读取 [Web 样式实践](./references/web-style-practice.md)，可直接使用完整 CSS 能力，注意 `rpx` 换算与移动端适配口径。
- **JSON 配置**：读取 [JSON 配置参考](./references/web-json-reference.md)，仅使用 Web 支持的字段；当需要分平台注册组件或差异化配置时，使用 `<script name="json">` 形式动态生成。

#### 3. 编译校验

使用本 skill 自带的编译校验脚本（位于 skill 目录下的 `scripts/compile-validate.js`，**不在宿主项目根目录下**）校验新建组件，参见下文 [编译校验脚本](#编译校验脚本)。建议同时校验所有目标平台（如 `--target=wx,web`），确保跨端兼容。

#### 4. 检查与确认

复用 [任务一 · 检查与确认](#6-检查与确认) 的清单，确认新建组件不引入任何 Web 不兼容写法，且 Web 专属能力均已正确隔离。

## 编译校验脚本

> **脚本位置**：编译校验脚本随本 skill 一同分发，位于 **skill 目录下** 的 `scripts/compile-validate.js`（即 `<skill-root>/scripts/compile-validate.js`），下文所有命令示例均使用 **指向 skill 目录的路径**调用该脚本，不要尝试在宿主项目根目录或 `node_modules` 中查找它。

该脚本基于宿主项目内安装的 `@mpxjs/mpx-cli-service` 进行真实编译校验：会自动从输入 `.mpx` 文件向上探测宿主项目根目录、加载工程编译配置、按指定 `target` 进行编译，并按 `style / template / script / json / dependency / other` 分类聚合错误与警告。改造或新建组件后建议作为强制环节运行。

### 命令行参数

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `<file.mpx>...` | - | 一个或多个待校验的 `.mpx` 绝对/相对路径 |
| `--target=<mode>` | `web` | 编译目标，多个用逗号分隔（如 `wx,web`）|
| `--type=<page\|component>` | `component` | 入口类型，决定使用 `getPageEntry` 还是 `getComponentEntry`，并影响 `partialCompileRules` 形态 |
| `--project-root=<path>` | 自动探测 | 显式指定宿主项目根目录 |
| `--no-ignore-sub-components` | 关闭 | 关闭默认子组件占位策略，递归编译所有子组件 |
| `--json` | 关闭 | 输出结构化 JSON 结果 |

退出码：`0` 校验通过；`1` 存在编译错误；`2` 运行期异常（如未找到 `@mpxjs/mpx-cli-service`）。

### 使用示例

> 下方示例中的 `<skill-root>` 表示本 skill 在宿主环境中的实际安装路径（例如 `.agents/skills/mpx2web`、`.claude/skills/mpx2web` 或 `~/.claude/skills/mpx2web` 等，以实际安装位置为准）；调用时使用该绝对路径，不要在宿主项目根目录下查找 `scripts/compile-validate.js`。

```bash
# 单组件、校验 Web 目标
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=web

# 显式指定为页面（影响 entry 与 partialCompileRules 形态）
node <skill-root>/scripts/compile-validate.js src/pages/index.mpx --type=page --target=web

# 跨端多目标校验（确保 Web 改造未破坏小程序原平台）
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=wx,web

# 输出结构化 JSON 便于二次处理
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=web --json

# 同时递归校验子组件（默认行为是仅校验目标自身）
node <skill-root>/scripts/compile-validate.js src/components/foo.mpx --target=web --no-ignore-sub-components
```

校验失败时按错误的 `category` 字段回到对应任务步骤定位与修正问题，再次运行直至通过。
