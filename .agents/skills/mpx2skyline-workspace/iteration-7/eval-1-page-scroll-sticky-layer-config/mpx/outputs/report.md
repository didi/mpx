# 订单页面适配与验证

已交付完整 `orders.mpx`、`app.json`、`service.js`。仅使用指定 `../mpx/SKILL.md` 及其相关 references；没有读取其他组 Skill、评分契约或历史输出。

页面输出目标为微信 `wx`，默认使用 Skyline / glass-easel。通过运行时 `renderer` 保留 WebView 分支；WebView 不是 `web` 编译目标。业务接入时将页面与 service 放到原 `pages/orders` 对应目录，合入所交付 app.json。原首页注册、window 和 rendererOptions.webview 原样保留，没有全局切换首页 renderer。输入未提供首页源码，不对首页实现作验证结论。

- 自定义导航显示“订单”，根据状态栏、胶囊与可用窗口高度安排导航和滚动区，窗口变化重新计算；不再固定 400px。
- 外层 `type="nested"`，120px 概览可随其离屏；内层订单区 `type="custom"`，声明 `associative-container="nested-scroll-view"`，两层均有明确高度。
- 刷新、触底和位置展示只接入内层 `bindrefresherrefresh`、`bindscrolltolower`、`bindscroll`，读取 `e.detail.scrollTop`。外层与横向区域没有业务监听，内层处理器另外过滤其他节点来源。
- Skyline 使用首子节点为白底 sticky-header 的 sticky-section；WebView 保留分组 CSS sticky。横向条启用 enable-flex、row 布局，直接子项宽120px且禁止收缩。
- 初始请求第1页；刷新替换列表，成功/失败均清除刷新状态，失败保留列表和页号。分页仅在成功后追加并推进页号，共用加载锁避免并发重复请求。页尾“加载更多订单”用于首屏内容不足以滚动时继续分页，同时保留主区域触底加载。
- 弹层与悬浮按钮移到页面根部，均为 fixed，弹层 z-index 3 高于按钮2；点击关闭并拦截弹层 touchmove。
- service.js 与输入逐字一致。app.json 补齐按需注入和五项 Skyline 对齐配置；页面关闭页面级刷新、启用 custom 导航并禁用页面滚动。

| 验证层级 | 结果 | 证据与边界 |
| --- | --- | --- |
| 静态 | passed | [完整48项矩阵复核](../run-1/static-audit.json)、Jest结构/JSON断言；覆盖本页面、页面JSON、app.json、service及宿主构建配置。无自定义组件子树。 |
| ESLint | passed | [eslint.json](../run-1/eslint.json)，业务页面与service为0错误、0警告。 |
| Mock / Jest | passed | [5项测试](../run-1/jest-results.json)、[实际请求和状态记录](../run-1/mock-evidence.json)、[测试源码](../run-1/orders.test.cjs)。VM执行实际页面选项及原service，窗口API、页面实例与事件为mock，不包含渲染。 |
| 真实编译 | passed | [wx编译JSON](../run-1/compile-wx.json)、[原始日志](../run-1/compile-wx.log)，CLI/webpack页面编译0错误、0警告；覆盖SFC及service依赖。app.json静态核对，未执行含原首页的全量业务构建。 |
| 微信开发者工具 | not_run | 未连接工具容器，未验证双模式可视渲染。 |
| 真机 WebView / Skyline | not_run | 嵌套滚动交接、概览离屏、分组吸顶、横纵手势、原生刷新反馈、真实触底/位置事件、弹层覆盖和自定义导航均待真机验证。 |

Mock在两个renderer参数下均验证：首次4组×8项；连续两次触底后第3页、12组96项，原分组及订单不变、id唯一；注入刷新失败后保留第3页和列表且结束反馈，随后成功加载第4页；正常刷新恢复第1页4组；主区域scrollTop更新为237，其他滚动来源不改变该值。另验证分页失败不推进、重试同页及重复触底互斥。两个参数运行同一业务逻辑，不代表实际双模式渲染成功。

矩阵中的吸顶、横向宽度、层级、数组类型与刷新节点候选均结合完整结构复核。使用默认refresher，无需自定义slot；WebView sticky样式只存在于该分支；fixed层级结构已修正，最终视觉结果仍为not_run。无Worklet、动画、媒体查询、字体、复杂图文或props兼容项。

执行命令（固定在指定workspace工作目录）：

```sh
node node_modules/eslint/bin/eslint.js iteration-7/eval-1-page-scroll-sticky-layer-config/mpx/outputs/orders.mpx iteration-7/eval-1-page-scroll-sticky-layer-config/mpx/outputs/service.js --format json
npm run compile-validate -- iteration-7/eval-1-page-scroll-sticky-layer-config/mpx/outputs/orders.mpx --type=page --target=wx --json
node /Users/didi/work/mpx/node_modules/jest/bin/jest.js --config '{"rootDir":"./iteration-7/eval-1-page-scroll-sticky-layer-config/mpx/run-1","testMatch":["**/orders.test.cjs"],"testEnvironment":"node","transform":{},"watchman":false,"cacheDirectory":"<rootDir>/jest-cache"}' --runInBand
node iteration-7/eval-1-page-scroll-sticky-layer-config/mpx/run-1/audit.cjs
```

真实编译时TMPDIR定向run-1/tmp；原始结果均存于run-1。首次Jest因Watchman在沙箱访问状态目录时发生fchmod EPERM，未进入测试；保留[失败日志](../run-1/jest-attempt-1.log)，关闭Watchman后5项全过。共修复运行参数1次，未超过3次上限。

结构化总记录：[validation.json](../run-1/validation.json)。编译与mock不能替代微信宿主和真机验证。
