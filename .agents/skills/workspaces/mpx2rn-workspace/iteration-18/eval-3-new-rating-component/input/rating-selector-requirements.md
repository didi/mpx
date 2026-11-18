# RatingSelector 组件需求

创建一个可复用评分选择器，接收以下数据：

- `ratingKey: String`：评分记录标识，默认为空字符串。
- `value: Number`：当前评分，默认为 `0`。
- `max: Number`：星级上限，默认为 `5`。
- `readonly: Boolean`：是否只读，默认为 `false`。
- `label: String`：标题，默认为“请评分”。

组件需展示标题、`max` 个星级项和“当前分 / 总分”文案。已选中和未选中星级项要有明显的视觉区分。

非只读时，点击第 N 个星级项后应立即显示 N 分，并触发 `change` 事件，事件 detail 为 `{ ratingKey, value: N }`。星级点击目标需提供明显的按压点击态反馈。父组件后续更新 `value` 时，组件显示也要同步。只读时点击不得更新评分或触发事件。

运行环境已全局注册 `rating-editable-tip` 和 `rating-readonly-tip` 两个自定义提示组件。评分器底部需使用动态组件：可编辑时渲染 `rating-editable-tip`，只读时渲染 `rating-readonly-tip`。动态组件的候选范围只包含这两个组件。无需在当前组件中重复注册，也不要创建它们的实现文件。

实现方式：

- 使用选项式 API。
- 使用常规 CSS。
