# 评分组件交付

已创建 `rating-selector.mpx`，包含 template、选项式 createComponent 脚本、普通 class 样式与 `component: true` JSON，无新增依赖。

- 属性：ratingKey:String、value:Number=0、max:Number=5、readonly:Boolean=false、label:String=评分。
- 点击第 n 颗星保存本地评分并触发 `change`，detail 为 `{ ratingKey, value: n }`；只读阻止更新与事件。立即监听 value，支持初始传入及后续父级更新。
- 星号为数组驱动的单行 Flex 等分布局；标签与当前分数位于上方同一行，标签占剩余宽度，并同时使用 WebView 省略 CSS 与 Skyline max-lines/overflow。
- 按下星号缩放至 0.96，touchend/touchcancel 恢复，transform 过渡 150ms。未引入高级手势、Worklet 或渲染器分支。

## 验证

- Jest：1 个测试套件、6 项测试通过，涵盖默认值/同步、点击事件、只读、按压恢复、max 数量和 JSON/省略结构。无失败修复。
- ESLint：组件脚本按仓库已有 Standard 配置检查，0 error、0 warning。
- Skyline 完整审计矩阵：47 条逐项检查，候选结合完整 SFC 复核，无未解释的 error/warn。证据及验证脚本位于同级 `run-1/`。

覆盖范围仅此组件，无自定义子组件或其他依赖文件。没有页面职责，app.json、页面渲染器、导航与滚动配置不属于本次交付。

未执行 Mpx 整包编译、微信开发者工具或真机测试。单测通过 VM 调用组件选项验证业务逻辑，不等价于真实框架挂载；双渲染下的超长标签、星形字形、等距视觉及触摸时序仍需在宿主工程分别验收。
