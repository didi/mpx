# SegmentedControl 组件需求

创建一个可复用分段选择器，接收以下数据：

- `controlKey: String`：选择器标识，默认为空字符串。
- `options: Array`：候选项数组，每项格式为 `{ label, value, disabled? }`，默认为空数组。
- `value: String`：当前选中值，默认为空字符串。
- `disabled: Boolean`：是否整体禁用，默认为 `false`。
- `label: String`：选择器标题，默认为“请选择”。

组件需展示标题、全部候选项及当前选中项文案。候选项要根据选中和禁用状态呈现明显的视觉差异。

点击可用候选项后应立即更新当前选中值，并触发 `change` 事件，事件 detail 为 `{ controlKey, value }`。所有可点击候选项在按压期间需呈现明显的点击态反馈。父组件后续更新 `value` 时，组件显示也要同步。整体禁用或候选项自身禁用时，点击不得更新选择或触发事件。

实现方式：

- 使用组合式 API。
- 使用常规 CSS。
