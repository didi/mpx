# Mpx2RN 适配检查清单

适配、新建组件或 Code Review 收尾时，按实际涉及的 SFC 区块逐项检查。

## 模板

- [ ] 基础组件、属性、事件均在 [模板能力参考](./rn-template-reference.md) 标注为 RN 支持，或已通过模板条件编译隔离；用户配置的 `rnConfig.customBuiltInComponents` 扩展除外。
- [ ] 动态 `class` / `style` 使用 `wx:class` / `wx:style`，未在属性值中拼接 `{{}}`。
- [ ] selector API 引用的模板节点均声明空 `wx:ref`。

## 脚本

- [ ] 生命周期、构造选项、实例方法与环境 API 均在 [脚本能力参考](./rn-script-reference.md) 和 [环境 API 参考](./rn-api-reference.md) 标注为 RN 支持，或已通过脚本条件编译隔离；用户通过 `custom` 配置扩展的环境 API 除外。
- [ ] 环境能力统一通过 `mpx.xxx` 调用，未直接使用 `wx.xxx` / `my.xxx`。
- [ ] selector API 仅使用 `#id` / `.class`。
- [ ] 挂载到实例的数据 key 未使用保留关键字 `id` / `dataset` / `data`。
- [ ] 使用 `<script setup>` 时，模板引用的数据与方法已通过 `defineExpose()` 显式声明，且未暴露模板未使用的大型 store、RN 原生对象等无 UI 数据。

## 样式

- [ ] 已展开并检查预处理器嵌套产生的最终选择器。
- [ ] `<style>`、`<template>`、`<script>` 中使用的选择器和样式属性均在 [样式能力参考](./rn-style-reference.md) 标注为 RN 支持，或已通过样式条件编译隔离。
- [ ] 伪元素已改为真实节点，`:active` 点击态已改为组件 `hover-class`，复杂选择器已拆为单类；对应模板、脚本和样式引用已同步。
- [ ] 已按模板顺序检查垂直 margin（含 `margin` 简写），只将确认在原平台发生折叠的双侧 margin 归到单侧并保留有效间距；不满足折叠条件或无法确认的保持原样。
- [ ] 启用 UnoCSS 时，工具类与 variants 均在 [原子 CSS 能力参考](./rn-atomic-css.md) 的 RN 支持范围内；动态类可被静态提取或已加入 `safelist`；颜色透明度未使用独立 `*-opacity-*` 组合。
- [ ] `/*use rpx*/` / `/*use px*/` 单位注释已保留。

## JSON 配置

- [ ] `<script type="application/json">` / `<script name="json">` 使用的字段均在 [JSON 配置参考](./rn-json-reference.md) 标注为 RN 支持，或已通过配置条件编译隔离。

## 条件编译

- [ ] RN 专属写法已通过条件编译限定在 RN 输出，原平台原有写法未被替换或删除。
- [ ] 仅最小包裹不兼容片段，没有大面积连续分叉。
- [ ] 样式条件编译包裹整条规则，产物中不存在空选择器。
- [ ] 各区块使用对应的条件编译语法，缩进敏感预处理器中的条件编译注释与所在块体同级缩进。

## 本地校验

- [ ] 已使用 `scripts/compile-validate.js` 覆盖全部目标平台，且编译结果无错误、无警告。
- [ ] 已通过宿主项目针对改动文件的 ESLint 检查，无相关错误与警告。
