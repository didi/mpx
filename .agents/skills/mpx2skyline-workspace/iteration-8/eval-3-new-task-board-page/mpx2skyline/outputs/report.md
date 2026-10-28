# 任务看板交付与验证

已交付 `pages/task-board.mpx`、选项式 `components/rating-selector.mpx`、组合式 `components/segmented-control.mpx` 和宿主 `app.json`。范围仅微信 wx 的 Skyline / WebView；页面实际注册并使用两个组件，未使用原子 CSS 或 Skyline 高级能力。

## 实现

- 首页注册、原 window 与 rendererOptions.webview 保持原值；仅看板页面声明 Skyline / glass-easel、自定义导航和 disableScroll。宿主补齐按需加载及五个 Skyline 对齐选项，未全局切换首页 renderer。
- 状态栏与胶囊避让、自定义标题、数量、分类和评分位于滚动容器外；按窗口高度确定页面高度，Flex 剩余空间形成纵向 `scroll-view type="list"`，窗口变化时更新高度。任务卡片是列表直接子节点。
- `category=全部/工作/生活` 决定初始分类，其他值回到全部；支持完成切换、空结果、连续追加任务和唯一键。
- 默认 refresher 与触底事件在两种 renderer 下共用；300ms 模拟请求成功恢复初始任务并清零评分，失败保留任务及评分，finally 关闭刷新反馈。刷新中防止重复请求与分页。
- 评分即时回显并发送 `{ratingKey,value}`；分类即时回显并发送 `{controlKey,value}`，父级 value 更新均同步。候选项在默认、null、异步更新路径中统一为数组；禁用入口拦截事件和按压。
- 任务标题、组件标题和候选文案同时保留 WebView 的单行省略 CSS 与 Skyline 的 `max-lines/overflow`。动态类/样式使用 `wx:class/wx:style`，setup 显式暴露模板绑定，属性默认值及列表 initData 已补齐。
- 两组件均以真实节点实现 150ms transform/opacity 过渡，按下 0.96/0.7，松开或取消恢复 1/1；状态属于各自实例。

## 可复现入口

- 正常：`/pages/task-board?category=生活`。
- 失败注入：`/pages/task-board?category=工作&refreshFail=1`，下次下拉刷新失败一次，随后下拉重试成功。
- 测试与原始证据均在相邻 `../run-1/`，汇总见 `validation.json`。

## 验证结果

| 层级 | 结果 | 证据与边界 |
| --- | --- | --- |
| 静态 | pass | ESLint 0 error / 0 warning；`audit.json` 覆盖完整 48 条矩阵规则；无未处理源码 error/warn。聚合扫描见 `audit-candidates.log`。 |
| 真实编译 | pass | `compile.json`：wx production，页面入口且 `ignoreSubComponents=false`，实际递归编译两个组件；0 error / 0 warning。包括 SFC、JSON、样式、setup 编译。 |
| 模板绑定与业务 mock | pass，21/21 | `behavior.test.cjs`、`jest-final.log`、`jest-results.json`；先确认真实编译成功，再调用真实 setup 编译器生成脚本，按源模板事件名调用处理器，并从实际组件标签读取属性、注册和回写事件。转换结果另存 `*.transformed.js`。 |
| 微信开发者工具 | not_run | 未启动微信开发者工具，未进行渲染或交互验收。 |
| Skyline 真机 | not_run | 未进行设备上的布局、滚动、刷新指示器和触摸视觉验证。 |
| WebView 真机 | not_run | 未进行 WebView renderer / 回退路径的设备验收。 |

Mock 使用 Vue 响应式原语模拟 Mpx 的 ref/computed/watch，模拟实例、事件与 wx 窗口 API，并使用 Jest 假计时器推进异步请求。它验证处理器与模板连接，不运行微信渲染器、原生属性校验或真实触摸事件分发。空结果通过公开组件 change 接口注入无匹配分类验证；正常三个分类的初始数据都有任务。

覆盖：合法/非法/缺省参数、筛选、完成切换、空结果、刷新成功/失败/重试、刷新并发防护、三种分类连续分页、默认属性、父级 value 连续更新、readonly/整体禁用/单项禁用、options 默认/空/null/数组、change detail、touchend/touchcancel、双实例状态隔离，以及页面真实注册/传参/事件回写和窗口高度更新。

验证修订：首次 ESLint 三条 initData 警告已补齐并重编译；Jest 初次受 Watchman 沙箱权限阻断，关闭测试侧 Watchman 后发现联动适配器属性解构错误，修正后 21 项全过，总计三次后续尝试。静态断言曾误匹配 `wx:class` 与 `flex-direction`，已限定匹配边界。未通过的过程日志保留；业务实现没有为测试断言改变契约。

## 待设备验收

用微信开发者工具及两种 renderer 真机复核：窄屏剩余滚动高度、长标题/候选文案省略、最大评分区域、状态栏与胶囊避让、真实下拉刷新反馈、连续触底追加、按压/取消动画，以及 glass-easel 下 null 候选属性传递。WebView 验收可在本地调试副本将页面 renderer 改为 `webview`；交付文件保留 Skyline 配置。未覆盖宿主首页源码、宿主构建入口和未提供的其他页面。
