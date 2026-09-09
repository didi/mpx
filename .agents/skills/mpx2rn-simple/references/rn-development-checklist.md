# Mpx2RN 开发约束与检查清单

本文档是 Mpx2RN 适配改造、新建组件与 Code Review 共用的唯一约束清单。开始实现前先完整读取并将其作为开发约束；完成实现后再按同一组条目逐项检查是否通过。

## 模板（template）

- [ ] 仅使用[模板能力参考 · 基础组件](./rn-template-reference.md#基础组件)中标注 RN 支持的基础组件、属性与事件；不支持项已通过模板条件编译隔离。若用户通过 `rnConfig.customBuiltInComponents` 扩展了能力，以用户说明为准。
- [ ] 需要页面滚动或使用 `onPullDownRefresh` / `onReachBottom` / `onPageScroll` 时，使用 `scroll-view` 及其等效能力；不依赖 RN 页面默认滚动。
- [ ] 仅对基础通用事件 `tap` / `longpress` / `touchstart` / `touchmove` / `touchend` / `touchcancel` 使用冒泡和捕获语义。
- [ ] 模板 Mustache 表达式不调用普通方法，相关逻辑已改用 `computed` / `wxs` 实现；i18n 翻译函数除外。
- [ ] 组合式 API 中 `useI18n()` 解构出的翻译函数以原名 `t` / `tc` / `te` / `tm` 暴露给模板，未重命名。
- [ ] 事件自定义参数优先通过内联传参语法（如 `bindtap="handleTap('param')"`）传递，未使用 `data-` dataset 属性绕行传参。
- [ ] 文字内容优先由 `text` 显式包裹，避免依赖框架为 `view` 中的裸文字补节点；跨平台布局对齐方案见[样式开发最佳实践 · text 跨平台布局对齐](./rn-style-practice.md#text-跨平台布局对齐)。
- [ ] 动态 `class` / `style` 使用 `wx:class` / `wx:style` 指令，未在属性值内使用 `{{}}` 拼接。
- [ ] selector 类 API 引用的模板节点均声明空 `wx:ref`，完成编译期映射。

## 脚本（script）

- [ ] 生命周期、构造选项和实例方法均在[逻辑能力参考](./rn-script-reference.md)标注的 RN 支持范围内；`onShareTimeline` / `onTabItemTap` / `onAddToFavorites` / `onSaveExitState` 等不支持项未直接用于 RN 产物。
- [ ] 环境能力统一通过 `@mpxjs/api-proxy` 提供的 `mpx.xxx` 调用，未直接使用 `wx.xxx` / `my.xxx`；具体支持范围以[环境 API 参考](./rn-api-reference.md)为准。若用户通过 `custom` 配置扩展了能力，以用户说明为准。
- [ ] `selectComponent` / `selectAllComponents` / `createSelectorQuery` / `createIntersectionObserver` 等 selector API 仅使用 `#id` / `.class`，并且对应模板节点已声明空 `wx:ref`。详见[逻辑能力参考 · 页面 / 组件实例方法与属性](./rn-script-reference.md#页面--组件实例方法与属性)。
- [ ] 挂载到实例上的数据 key（包括 `props` / `data` / `computed` / `methods` / `setup return` / `inject` 等）未使用保留关键字 `id` / `dataset` / `data`，避免触发 `reserved keyword of miniprogram` 错误。
- [ ] 使用 `<script setup>` 时，模板引用的数据与方法均通过 `defineExpose()` 显式声明，且未暴露模板未使用的大型 store、RN 原生对象等无 UI 数据。

## 样式（style）

- [ ] 样式属性是否支持以[样式能力参考](./rn-style-reference.md)为准，而不是以 RN 原生样式能力为准；Mpx2RN 已抹平支持的简写属性、CSS 变量、`calc()`、媒体查询、`rpx`、颜色格式和文本继承等能力无需额外替换或条件编译。
- [ ] `<style>` 中不存在未展开的嵌套选择器，也未使用复合选择器、伪类或伪元素等 RN 不支持的选择器；相关写法已改为单类等效实现，并同步更新 `<template>` 与 `<script>` 中的引用。逗号分隔的并列单类选择器可直接使用。
- [ ] 动态样式优先使用 `wx:class` / `wx:style` 指令，未在 `class` / `style` 属性中拼接 `{{}}` 插值表达式。
- [ ] 基础组件的 CSS 变量、文本样式与文本属性透传、背景图像、API 动画或 transition 可能在首次渲染后由动态样式或属性引入时，已分别通过 `enable-var` / `enable-text-pass-through` / `enable-background` / `enable-animation` 在首次渲染时预声明；`hover-class` 的存在状态和 `enable-animation` 的动画类型在同一组件实例生命周期内保持稳定。仅普通值变化且能力类型始终存在时未冗余预声明。详见[样式开发最佳实践 · 按需样式能力预声明](./rn-style-practice.md#按需样式能力预声明)。
- [ ] 条件分支或列表渲染可能复用同一基础组件节点且各分支 / 列表项使用的按需样式能力不一致时，已优先提供独立且稳定的 `key` / `wx:key`；无法提供时，已按所有可能能力的并集在每个可能复用的节点上添加 `enable-*` 预声明，避免复用前后改变 Hook 调用。
- [ ] 优先采用[样式开发最佳实践](./rn-style-practice.md)中的跨端兼容方案：兼容写法可在原平台生效时直接全量替换；RN 专用写法无法在原平台生效时使用条件编译双轨保留两端实现。
- [ ] 原始样式中的 `/*use rpx*/` 与 `/*use px*/` 单位注释均已保留。
- [ ] 项目启用 UnoCSS 或模板使用原子类时，工具类与 variants 均在[Mpx2RN 原子 CSS 能力参考](./rn-atomic-css.md)标注的 RN 支持范围内；动态类可被静态提取或已加入 `safelist`；颜色透明度使用 `bg-red-500/50` 等斜杠 alpha 语法，未使用独立 `*-opacity-*` 组合。
- [ ] 已按模板中的实际节点关系审计垂直 margin，并展开理解 `margin` 简写与长写。仅对确认在原平台发生折叠且同一间距由两侧共同表达的节点，将折叠后的有效间距归到单侧；已排除 Flex / Grid、浮动、`position: absolute/fixed`、clearance、父子关系中的 BFC 与分隔条件、空块阻断条件等不折叠场景；无法确认时保持原样。详见[样式开发最佳实践 · 处理垂直 margin 折叠](./rn-style-practice.md#处理垂直-margin-折叠)。

## JSON 配置

- [ ] 应用、页面与组件配置字段均在[JSON 配置参考](./rn-json-reference.md)标注的 RN 支持范围内；`tabBar` 等不支持字段已通过条件编译隔离。
- [ ] 需要分平台或分环境定义配置时，使用 `<script name="json">` 并通过 `__mpx_mode__` / `__mpx_env__` 动态生成。

## 条件编译

- 原平台条件：根据用户项目配置确定，一般为 `__mpx_mode__ === 'wx' || __mpx_mode__ === 'ali' || __mpx_mode__ === 'web'`
- RN 平台条件：`__mpx_mode__ === 'ios' || __mpx_mode__ === 'android' || __mpx_mode__ === 'harmony'`

- [ ] 产物代码在原平台与 RN 平台均能正常运行。引入 `numberOfLines@ios|android|harmony`、`hairlineWidth` 等仅 RN 生效的写法时，通过条件编译限定在 RN 输出，并同步保留原平台原有写法，未因 RN 适配造成原平台行为退化。
- [ ] 条件编译只作为没有跨端兼容写法时的最后手段，并仅包裹真正不兼容的最小片段，不存在大面积连续分叉。
- [ ] 样式条件编译优先只包裹不兼容属性；当整条规则均不兼容或某个平台会被裁剪为空规则时，才将选择器与声明块整体包裹，确保产物中不存在空选择器。详见[条件编译 · 避免产物中出现空选择器](./conditional-compile.md#避免产物中出现空选择器)。
- [ ] stylus / sass 等缩进敏感预处理器中的条件编译注释与所在块体同级缩进，避免占位注释截断块上下文并触发 `expected "indent", got "outdent"` 等错误。
- [ ] 各区块使用对应语法：样式使用 `/* @mpx-if (...) */`，模板使用 `wx:if="{{...}}"` 或 `@mode` 属性后缀，脚本和 JSON 使用 `if (__mpx_mode__ === ...)`；新增代码不使用历史兼容语法 `@_mode`。详见[条件编译](./conditional-compile.md)。
