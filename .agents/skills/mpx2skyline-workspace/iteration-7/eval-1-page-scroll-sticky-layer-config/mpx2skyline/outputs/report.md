# 订单页 Skyline 适配与验证

已交付完整 `orders.mpx`、`app.json`、原样保留的 `service.js`。仅覆盖微信 WebView / Skyline；页面全部由内建组件构成，无待适配的业务子组件。原首页路由、window 和 rendererOptions.webview 保留；未提供的首页源码未覆盖。

## 实现

- 实际显示“订单”自定义导航，按窗口、状态栏与胶囊位置计算导航和可用滚动高度，窗口变化时重算；概览总高 120px。
- Skyline 外层使用 `type="nested"`，直接子节点为 `nested-scroll-header` / `nested-scroll-body`，各承载一个子节点；内层 `type="custom"` 通过 `associative-container="nested-scroll-view"` 关联。概览属于外层滚动，内层占用导航下方可用高度。
- Skyline 使用每组一个 `sticky-section`，首子节点为有白色背景的 `sticky-header`；WebView 运行时分支保留普通嵌套滚动和 CSS sticky。专属节点通过 `renderer === 'skyline'` 隔离。
- 横向订单区显式设置 list、enable-flex 和 row；直接订单项宽 120px、禁止压缩。横向事件被本层接住，不触发主区域分页或更新纵向位置。
- 每个 renderer 同时只有一个主订单纵向区域承接刷新、触底及 scroll。读取 `e.detail.scrollTop` 更新概览；移除页面滚动生命周期与 stopPullDownRefresh。
- 初次请求第 1 页；刷新成功替换、失败保留列表和页号，两条路径均结束 refreshing 并释放请求锁；分页追加分组且仅成功后推进页号。并发请求被抑制，失败可继续刷新或分页。
- 全屏弹层与悬浮按钮为页面下的 fixed 同级节点，层级 3 > 2；弹层移出滚动容器，点击关闭，并阻止背景触摸移动。
- 页面启用 skyline / glass-easel、custom 导航、disableScroll，关闭页面级下拉；全局补齐 lazyCodeLoading 和五个 Skyline 对齐项，没有全局切换首页 renderer。

## 验证结果

| 类别 | 状态 | 实际执行与证据 |
| --- | --- | --- |
| 静态矩阵 | passed | 全部 48 条规则检查，含结构复核；无未说明的 error / warn。见 `../run-1/audit-results.json`、`audit.log` |
| ESLint | passed | 使用已安装的 @mpxjs/eslint-config 检查两个业务源码文件，无错误。见 `../run-1/eslint.log`、`eslint.config.cjs` |
| Jest / mock | passed | 6 项测试全部通过，覆盖两种 renderer 的逻辑 fixture。见 `../run-1/orders.test.cjs`、`jest-results.json`、`mock-evidence.json` |
| 微信真实编译 | passed | npm run compile-validate，wx、page、包含依赖，0 errors / 0 warnings。见 `../run-1/compile.log` |
| 完整宿主应用构建 | not_run | 输入只含订单页与 app.json；首页等宿主应用源码未提供。app.json 已静态解析并核对保留字段 |
| 微信开发者工具渲染 | not_run | 未启动实际小程序运行环境 |
| 真机 | not_run | 两种 renderer 的嵌套衔接、吸顶、横向与纵向手势、下拉反馈、原生触底派发及弹层实际覆盖未验证 |

Mock 使用输出页面提取的原始脚本和原样 service，只替换 createPage 宿主注册与 wx 接口，不运行 Mpx 响应式或原生渲染。检查模板绑定及方法调用，不能证明真实事件派发或界面表现。

Mock 证据包括：初次 4 组 / 32 条；连续第 2、3 页后 12 组 / 96 条，原分组和订单数组对象保留且 ID 唯一；刷新恢复为第 1 页；`reload(true)` 实际调用 `fetchOrders(1, true)`，失败后保留已有 8 组和页号 2、结束刷新，并可继续请求第 3 页及刷新；主 scrollTop 更新为 186，横向事件不改写该值。另覆盖窗口变化、弹层开关、并发抑制和分页失败重试。

真实编译验证的是微信 Mpx 构建链及页面产物，不等同于 Skyline/glass-easel 真机运行验收。官方嵌套组件文档尝试访问但正文不可获取，未将其记录为已完成的能力验证；没有读取其他 Skill 或历史输出。

验证工具修正均在限制内：Jest 首次因 Watchman 沙箱权限失败，禁用 Watchman 后通过；静态审计脚本修正一次括号语法、一次将 flex-direction 误召回为 direction 的表达式，第三次运行通过。失败日志一并保留，业务测试无失败用例。

## 待真机验收

分别在 Skyline 和 WebView 下检查：概览随外层移出、内层独立滚动与组标题吸顶；横向浏览不会刷新/分页；主区域下拉成功及注入失败后反馈复位，随后可继续操作；连续两次触底保留原订单；概览展示内层位置；全屏弹层覆盖按钮且可关闭。短内容与大屏下触底事件的派发也需纳入验收。未执行项均为 not_run。

复跑命令与结构化状态见 `../run-1/validation.json`。所有命令工作目录为本 workspace；验证脚本与日志均位于本组 run-1，没有修改输入、Skill 或环境配置。
