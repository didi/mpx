# SegmentedControl 组件需求

创建一个无外部依赖的可复用分段选择器，对外提供以下 props：

- `controlKey: String`：选择器标识，默认为空字符串。
- `options: Array`：候选项数组，每项格式为 `{ label, value, disabled? }`，默认为空数组。
- `value: String`：当前选中值，默认为空字符串。
- `disabled: Boolean`：是否整体禁用，默认为 `false`。
- `label: String`：选择器标题，默认为“请选择”。

组件需渲染标题、全部候选项及当前选中项文案。候选项要根据选中和禁用状态呈现明显的视觉差异，并为循环节点声明稳定的 `wx:key`。

点击可用候选项后应立即更新本地选中值，并触发 `change` 事件，事件 detail 为 `{ controlKey, value }`。父组件后续更新 `value` 时，组件显示也要同步。整体禁用或候选项自身禁用时，点击不得更新选择或触发事件。

使用 `.mpx` 单文件组件完成，并满足以下实现约束：

- 必须使用 `<script setup>` 组合式 API，通过 `defineProps` 声明属性，通过 `ref`、`computed`、`watch` 组织状态，并用 `defineExpose` 显式暴露模板绑定。
- 对 props 按字段使用时必须通过 `toRefs` 或 `toRef` 保持响应式，不要直接解构 props。
- 样式必须写在 `<style>` 中，通过语义化普通 class 实现；不要使用 UnoCSS、原子 CSS 或 utility class。
- 动态类使用 `wx:class`，事件参数使用内联传参；不要使用 `data-*` / `dataset`，也不要在 Mustache 中调用普通方法。
- 用户可见文字使用 `text` 组件显式包裹，点击目标使用 `hover-class`，样式仅使用 RN 支持的单类选择器和属性。
- 不使用外部组件、图片资源、平台专属 API 或不必要的条件编译；除非实现确实需要，不要添加 JSON 配置。
