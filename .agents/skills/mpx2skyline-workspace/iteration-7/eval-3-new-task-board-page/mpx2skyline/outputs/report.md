# 任务看板交付与验证报告

已交付 `pages/task-board.mpx`、选项式 `components/rating-selector.mpx`、组合式 `components/segmented-control.mpx` 和 `app.json`。页面采用 `script setup`，真实注册两个组件，并通过公开属性和 change 事件连接状态。

仅覆盖微信 wx 的 WebView / Skyline。宿主首页仍为首项，原 `window` 与 `rendererOptions.webview` 保留；仅看板页面声明 Skyline/glass-easel、自定义导航与禁用页面滚动。宿主首页源码未提供，不在本次编译范围内。

## 实现要点

- 标题、结果数量、分类与评分位于滚动区外；自定义导航避让状态栏和胶囊，提供首页入口。滚动区使用窗口高度、纵向 Flex 剩余空间和 `min-height: 0`，窗口变化时重算。
- `scroll-view type="list"` 的任务项为直接子节点，两端共用刷新与触底事件。刷新模拟 300ms 请求，成功恢复初始任务并清零评分，失败保留列表及评分，`finally` 结束刷新反馈。刷新期间拦截重复刷新及分页。
- 每次触底保留原任务并追加两项，分类遵循当前选择；全部时追加工作任务，递增键在刷新后也不复用。
- 两个组件独立保存选择与按压状态，同步父级 value；禁用项不改变选择或发出事件。候选数据初始化和 null 输入均归一为空数组。真实节点通过动态 class 实现 `scale(0.96)`、`opacity: 0.7`，150ms 过渡，touchend/touchcancel 恢复。
- 标题、评分标签及候选文案同时具备 WebView 单行省略样式和 Skyline `max-lines` / `overflow` 属性；评分星级、分数不收缩。未使用原子 CSS、Worklet 或 Skyline 专有交互逻辑。

## 真实验证

| 层级 | 结果 | 证据与边界 |
| --- | --- | --- |
| 静态检查 | passed | ESLint 三个 SFC 零错误、零警告；指定 Skill 全部 48 条矩阵已扫描并逐项复核，无未解释 error/warn。见 `../run-1/eslint.log`、`audit.json`、`audit-candidates.log`。 |
| 真实 Mpx 编译 | passed | 使用允许的共享 compile-validate 工具，以 wx/page 入口开启子组件递归编译；三个 SFC、setup 与真实组件注册通过，零错误、零警告。见 `compile.cjs`、`compile.json`、`compile.log` 和 `compiled/`。这是页面及依赖树编译，不是完整宿主 app 构建。 |
| mock 业务测试 | passed，18/18 | Jest 使用真实 Mpx SFC/setup 编译器和 Vue 响应式，读取真实编译 WXML 的事件名、dataset、组件属性及 JSON 注册路径，再调用处理器。微信窗口、跳转、计时器与组件挂载/父子同步由 mock 提供。见 `business.test.cjs`、`harness.cjs`、`jest.log`、`jest-result.json`、`mock-scripts/`。 |
| 微信开发者工具运行 | not_run | 当前未连接开发者工具，未执行 WebView/Skyline 实际渲染。 |
| 真机 | not_run | 当前未连接微信真机；原生下拉反馈、触底触发、150ms 动画、胶囊/安全区、窄屏布局及实际文字省略仍需双 renderer 验收。 |

mock 覆盖：合法/非法/缺省分类参数、筛选数量、完成状态往返、空列表条件、刷新成功/失败及恢复、连续分页与唯一键；默认属性、父级 value 连续更新、readonly/整体禁用/单项禁用、空/null/异步数组候选、准确 change detail、两个实例隔离、触摸结束/取消；页面真实注册路径、路由初值传参、组件事件回写与刷新后评分同步。

空态测试通过公开分类 change 注入无匹配分类，验证实际模板条件；正常三个分类下初始任务均非空。窄屏测试仅验证 mock 窗口数据与高度计算，未将其当作视觉验收。

测试启动曾出现 Watchman 沙箱权限错误，随后关闭测试配置的 Watchman；mock 编译器调用曾缺少 loader 上下文，已按真实接口修正。这两次修正的原日志保留于 `jest-attempt-1.log`、`jest-attempt-2.log`。静态审计脚本另修正一次大括号正则，原日志为 `audit-attempt-1.log`；未出现业务断言失败，未超过三次修复。

## 复现与接入

所有命令均在指定 workspace 执行；以下路径前缀为 `iteration-7/eval-3-new-task-board-page/mpx2skyline/`：

```sh
node iteration-7/eval-3-new-task-board-page/mpx2skyline/run-1/compile.cjs
node node_modules/eslint/bin/eslint.js iteration-7/eval-3-new-task-board-page/mpx2skyline/outputs/pages/task-board.mpx iteration-7/eval-3-new-task-board-page/mpx2skyline/outputs/components/rating-selector.mpx iteration-7/eval-3-new-task-board-page/mpx2skyline/outputs/components/segmented-control.mpx
node /Users/didi/work/mpx/node_modules/jest/bin/jest.js --config iteration-7/eval-3-new-task-board-page/mpx2skyline/run-1/jest.config.cjs --runInBand
node iteration-7/eval-3-new-task-board-page/mpx2skyline/run-1/audit.cjs
```

页面入口 `/pages/task-board`，可传 `category=工作` 或 `category=生活`，缺省/非法值为全部。失败测试入口 `/pages/task-board?refreshFail=1`，下拉后模拟失败；不传此参数或传 `refreshFail=0` 时刷新成功。页面默认请求 Skyline，WebView 采用相同通用实现；双 renderer 的实际效果需在微信环境切换验证。保留平台 Skyline 开量控制，未强制关闭 AB/回退机制。

结构化结果见 `../run-1/validation.json`，其中记录受验证业务文件的 SHA-256；无评分、assessment 或手填耗时/Token 数据。
