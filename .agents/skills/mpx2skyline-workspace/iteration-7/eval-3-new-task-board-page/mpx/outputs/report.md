# 任务看板交付与验证

已交付任务页面、选项式 rating-selector、script setup 组合式 segmented-control 和宿主 app.json。仅面向微信 `wx`，WebView 与 Skyline 共用页面业务实现。保留宿主首页、window 和 rendererOptions.webview；看板页面选择 Skyline/glass-easel，配置自定义导航和禁用页面滚动，提供返回首页入口。

标题、分类与评分位于滚动区外。列表使用显式 `type="list"` 的 scroll-view，列表项为直接子节点；确定高度的纵向 Flex 页面为窄屏保留滚动区域。下拉刷新走 refresherrefresh，触底走 scrolltolower。长标题和候选文案同时保留 WebView CSS 省略及 Skyline max-lines/overflow 属性。两个组件以独立实例状态和 transform/opacity 的 150ms transition 实现按压反馈。

分类参数使用 `category=全部/工作/生活`，非法值回到全部。刷新模拟 300ms 异步请求；可通过 `refreshFail=1` 或页面公开方法 `injectRefreshFailure(true)` 令下一次刷新失败。失败保留当前任务和评分，成功恢复初始任务并将评分归零；两条路径均复位刷新状态。连续触底追加当前类别的两条任务，全部类别追加工作任务，递增键不会因刷新复用。

| 验证层级 | 结果 | 证据（相对 ../run-1/） |
| --- | --- | --- |
| 静态配置、模板及完整 Skyline 检查矩阵 | passed，覆盖页面、两个组件、app.json 及只读宿主构建配置；无未解释 error/warn | skyline-audit.json、template-bindings.json |
| ESLint | passed，0 error / 0 warning | eslint-final.log |
| 真实 Mpx wx 编译 | passed，页面递归依赖编译与两个独立组件入口编译均无 error/warning | compile-results.json、compiled-wx/ |
| Jest mock | passed，10/10 | task-board.test.cjs、jest-final.log |
| 微信开发者工具 WebView / Skyline | not_run | validation.json |
| 微信真机 WebView / Skyline | not_run | validation.json |

Jest 使用真实 Mpx SFC 解析器及 script setup 编译器，之后从交付模板中的实际事件绑定调用处理器；注册、生命周期、事件与父级传值使用 mock，响应式使用 Vue 2.7，异步请求使用假定时器。覆盖参数初始化、非法回退、筛选、完成状态、空态、刷新成功/失败及重入、连续分页、默认属性、连续父级 value 更新、只读/整体与单项禁用、options 空/null/异步数组、change detail、触摸结束/取消、实例隔离、页面注册/传参及事件回写。空态由公开分类状态的测试 fixture 构造，固定初始任务在三个正常类别下均有匹配项。

首次 ESLint 的三条 initData 警告已修复。Jest 最初受 Watchman 沙箱写权限影响，随后在命令参数中关闭 Watchman；首轮 mock 发现测试适配器重复暴露属性和缺少父级属性回传的夹具问题，修复一次后全部通过，原始失败日志保留。没有因 mock 夹具失败修改业务实现，未超过三次修复上限。

复跑时固定在工作目录执行：

```sh
node iteration-7/eval-3-new-task-board-page/mpx/run-1/compile.cjs
node node_modules/eslint/bin/eslint.js iteration-7/eval-3-new-task-board-page/mpx/outputs/pages/task-board.mpx iteration-7/eval-3-new-task-board-page/mpx/outputs/components/rating-selector.mpx iteration-7/eval-3-new-task-board-page/mpx/outputs/components/segmented-control.mpx --max-warnings=0
node /Users/didi/work/mpx/node_modules/jest/bin/jest.js --config '{"rootDir":"./iteration-7/eval-3-new-task-board-page/mpx/run-1","testMatch":["**/*.test.cjs"],"testEnvironment":"node","transform":{},"watchman":false}' --runInBand
node iteration-7/eval-3-new-task-board-page/mpx/run-1/verify.cjs
```

真实编译验证的是微信产物及 setup 绑定，不证明两种 renderer 的实际视觉或宿主行为。当前未提供首页源码，未进行完整宿主应用构建；app.json 的首页保留与配置合并已静态验证。实际验收需在微信环境分别验证默认 Skyline 和将测试页面 renderer 设为 webview 的构建：窄屏滚动、顶部常驻、长文本省略、连续触底、刷新失败后可用性、胶囊/安全区及按压取消/150ms 过渡。无 Worklet 或其他平台产物。
