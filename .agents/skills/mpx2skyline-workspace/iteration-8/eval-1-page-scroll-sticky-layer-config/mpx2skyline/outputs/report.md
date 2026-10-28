已完成 orders.mpx、app.json 与 service.js 的完整交付。范围仅为微信 WebView / Skyline；只使用指定的 iteration-8/skill-snapshots/mpx2skyline 快照及获准的基础编译工具。输入与 Skill 均未修改。

页面展示“订单”自定义导航，按窗口高度、状态栏及胶囊区域计算导航与可用滚动高度，并在窗口变化时重算。概览总高 120px，位于有界的外层 `type="nested"` 滚动容器中；内层订单区高为导航下方可用高度，因此外层内容总高为该高度加 120px，概览可滚出视口。内层采用 `type="custom"` 和 `associative-container="nested-scroll-view"`。

刷新、触底、滚动位置分别由内层 `catchrefresherrefresh`、`catchscrolltolower`、`catchscroll` 承接。外层没有业务事件；每组横向区域拦截自身滚动与触底事件，避免更新概览或触发分页。所有滚动容器显式指定 type。横向列表开启 enable-flex，使用 row 布局，直接订单节点宽 120px、禁止压缩，保留分组与订单 id key。

Skyline 根据运行时 `renderer === 'skyline'` 使用 sticky-section，首子节点为唯一的 sticky-header，并显式设置白色背景。WebView 分支保留每组内的 CSS sticky。两端共用刷新和分页逻辑，已移除页面滚动生命周期。刷新成功替换第 1 页，失败保留列表及页号；两种结果均结束 refresher-triggered。分页成功才追加数据并推进页号，失败可重试；请求期间防止重复分页和刷新竞争，分页期间禁用下拉刷新。

说明弹层与悬浮按钮均为页面根部兄弟 fixed 节点，弹层 z-index 3 高于按钮的 2，四边为 0，点击关闭，并拦截 touchmove。已移除原滚动区域的 transform 与无效层级假设。

app.json 保留原 pages 顺序、首页、window 和 rendererOptions.webview，只补齐 lazyCodeLoading 与五项 Skyline 对齐配置。仅订单页声明 skyline、glass-easel、自定义导航与 disableScroll，未全局切换首页渲染器。service.js 与输入逐字节一致。集成时将 orders.mpx 与 service.js 放入同一 pages 目录（页面路径 pages/orders），合并 app.json；输入未提供首页正文，本次没有改写或验证首页实现。WebView 验收可将测试工程该页面 renderer 改为 webview，或验证实际 WebView 回退；交付页默认仍为 Skyline。

| 验证层次 | 状态 | 真实证据及边界 |
| --- | --- | --- |
| 静态 | passed | `../run-1/static.json`：8 项配置、AST 结构、事件归属、宽度、层级等检查；`audit.json`：完整 48 条矩阵扫描与人工复核，未留下未解释的静态 error/warn。`STYLE_TEXT_UNSUPPORTED` 命中 flex-direction 为误报。 |
| ESLint | passed | `../run-1/eslint.json`、`eslint.log`；实际检查 orders.mpx 与 service.js，Mpx essential、JS recommended 等规则下 0 error / 0 warning。 |
| Mock / Jest | passed | `../run-1/jest.json`、`jest.log`、`mock-evidence.json`；6 项测试，分别以 skyline/webview 实例值执行交付脚本。mock createPage 与 wx，实际调用交付 service.js，不模拟原生布局或手势。 |
| wx 真实编译 | passed | `../run-1/compile.log`、`compile.json`；使用获准工具执行 wx page 编译，包含 service.js 与双模式模板分支，0 error / 0 warning。app.json 通过静态配置校验；未构建完整首页应用，也未运行微信客户端。 |
| 微信开发者工具可视验收 | not_run | 未连接开发者工具运行环境。 |
| 真机 WebView / Skyline | not_run | 嵌套滚动接力、组标题吸顶、横向/纵向手势、原生刷新反馈、弹层命中与可视层级、安全区及旋转后的实际布局均待真机验收。 |

mock-evidence.json 记录两种 renderer 下同一业务链路：初次请求第 1 页得到 4 组/32 条；连续分页第 2、3 页后得到 8 组/64 条、12 组/96 条，保留原分组及条目且 id 唯一；主区域 scrollTop 更新为 238，横向事件不改变该值；刷新成功恢复 4 组/第 1 页；再分页后用 reload(true) 调用 fetchOrders(1,true) 注入刷新失败，保留 8 组/第 2 页并结束刷新，再分页成功到 12 组/第 3 页。另验证分页失败页号不推进、重试仍请求同一页，以及重复触底不重复发请求。

Jest 第一次启动因沙箱中的 Watchman 状态目录权限被阻断，业务测试尚未执行，日志保留于 `jest-attempt-1.log`；关闭 Watchman 后第二次执行全部通过。业务测试失败次数为 0，无业务代码失败修复。静态解析探查中旧版解析器不接受 ecmaVersion 2022，正式结构检查使用其支持的 2020。真实编译执行 1 次通过。所有命令固定在指定 workspace 根目录执行；复现命令与文件指纹见 `../run-1/validation.json`。未生成评分文件或自行填写耗时、Token 指标。

真机验收顺序：两种渲染器分别进入订单页；滚动概览离开视口并确认内层仍可独立滚动；逐组检查标题吸顶与推离；横向浏览并确认不触发分页或修改概览位置；在内层下拉刷新、连续触底两次；通过 reload(true) 验证失败恢复；打开说明确认覆盖按钮、背景不滚动，点击关闭；改变窗口尺寸复查高度。上述步骤均为待执行清单，未计入已通过验证。
