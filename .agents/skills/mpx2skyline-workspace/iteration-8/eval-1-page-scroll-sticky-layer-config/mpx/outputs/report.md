# 订单页适配与验证报告

## 交付与范围

- 完整文件：`orders.mpx`、`app.json`、`service.js`，仅覆盖微信 wx 的 WebView / Skyline。
- 仅使用指定 `iteration-8/skill-snapshots/mpx/SKILL.md` 及其按需参考；未使用其他 Skill、评测契约或历史输出。
- `service.js` 与输入逐字一致；`app.json` 保留原首页、页面列表、window 和 `rendererOptions.webview`。
- 页面设置 `renderer: skyline`、`componentFramework: glass-easel`、自定义导航及禁用页面滚动。应用补齐 `requiredComponents` 和 Skyline 五项默认行为对齐配置；未全局切换其他页面 renderer。

## 实现

- 实际显示“订单”自定义导航，按状态栏与胶囊位置确定高度。纵向滚动区高度为可用窗口高度减导航总高度，窗口变化时重算；不沿用固定 400px。
- 外层 `type="nested"` 包含 120px 概览和订单主体。主体高度与外层视口相同，内容总高度多出概览的 120px，使概览可以随外层离开视口。
- 主体 `type="custom"`，通过 `associative-container="nested-scroll-view"` 与外层关联。只有主体绑定 `refresherrefresh`、`scrolltolower`、`scroll`；外层没有数据交互事件，横向区也没有这些绑定。滚动位置取 `e.detail.scrollTop`，概览展示主订单区的位置。
- Skyline 分支为 `sticky-section`，首个子节点为有白色背景的 `sticky-header`；WebView 分支保留分组内 CSS sticky。通过实例 `renderer` 运行时分支区分，两个分支均为 wx 输出。
- 两个分支的横向区均显式声明 `type="list"`、`scroll-x`、`enable-flex` 和横向 Flex；直接子节点宽 120px、禁止收缩，订单使用稳定 id。保留原 40px 标题与 80px 订单行高度。
- 首次加载第 1 页。刷新成功替换列表并重置页号，失败保留列表和页号、显示错误；两条路径均结束受控刷新状态。加载锁防止并发重复分页，分页成功后才推进页号。
- 悬浮按钮与全屏弹层都是滚动区外、同父级的 fixed 节点，弹层 `z-index:20` 高于按钮的 10；点击弹层关闭。移除原滚动区 transform 和局部 absolute 弹层。

## 验证结果

证据目录为同级 `../run-1/`，统一索引见 [validation.json](../run-1/validation.json)。

| 验证层级 | 状态 | 真实证据与边界 |
| --- | --- | --- |
| 静态检查 | pass | [audit-matrix.json](../run-1/audit-matrix.json) 逐项记录 48 条矩阵规则；[static-scan.log](../run-1/static-scan.log) 保留聚合扫描命中。覆盖四个 SFC 区块、app.json、service 和现有构建配置；仅原生组件，无遗漏业务组件子树。 |
| ESLint | pass | [eslint.log](../run-1/eslint.log)，检查交付 `.mpx` 和 `.js`，退出码 0。 |
| Jest / mock | pass | 7 项测试通过，见 [jest-results.json](../run-1/jest-results.json)、[orders.test.cjs](../run-1/orders.test.cjs) 和 [mock-evidence.json](../run-1/mock-evidence.json)。实际执行业务方法及原 service，窗口/胶囊 API 为 mock；没有原生模板渲染。 |
| 真实 wx 编译 | pass | `npm run compile-validate -- <outputs/orders.mpx> --target=wx --type=page --json`；[compile-wx.json](../run-1/compile-wx.json) 记录 success=true、errors=[]、warnings=[]。为真实 SFC 编译，app.json 另外静态核对，未执行完整应用构建。 |
| WebView 容器运行 | not_run | 未连接微信运行容器；mock 中的 renderer 标签不代表原生双模式运行。 |
| Skyline 容器运行 | not_run | 同上，编译成功不证明手势与布局正确。 |
| 真机嵌套滚动、吸顶与手势 | not_run | 未连接真机。还需验证概览滚出与内外接力、分组吸顶、横纵手势归属、刷新反馈、触底事件和弹层覆盖。 |

Mock 在 WebView / Skyline 两种实例标签下各执行：初次 4 组 / 32 条 → 第 2 页 8 组 / 64 条 → 第 3 页 12 组 / 96 条，原组及其订单对象保留且 id 唯一；刷新替换为 4 组；`reload(true)` 调用 `fetchOrders(1,true)` 后保留列表并复位反馈；失败后可继续分页；主滚动事件更新为 137。另验证分页失败页号不推进、重试请求同一页、并发去重及窗口变化重算高度。

Jest 第一次在测试启动前因 Watchman 状态目录权限失败，原始错误保留于 [jest-attempt-1.log](../run-1/jest-attempt-1.log)。第二次仅追加 `--watchman=false` 后全部通过，未修改环境配置，未发生业务代码失败修复。

矩阵 error 无静态未处理项。warn 已逐项说明：CSS sticky 仅在 WebView 分支，横向直接子项明确宽度，刷新使用默认指示器，无自定义 slot；fixed 层级结构已修正，但实际遮挡仍待运行验证。不涉及 Worklet、媒体、字体、动画、图文混排、组件 properties 或节点查询。

## 微信环境验收入口

以本页 Skyline 配置运行，核对实际实例 renderer；再通过工程现有 WebView 回退或测试页配置运行同一份代码，核对 WebView 分支。上滑概览、滚动主区、逐组横向浏览，确认只有主区驱动列表和位置展示；下拉刷新，触底两次，再注入 `reload(true)` 并继续刷新/分页；打开弹层并点击关闭。列表内容不足主区视口高度时无纵向溢出，应同时覆盖较小窗口及分页后的长列表场景。以上为待执行验收步骤，不计为已经通过的运行证据。
