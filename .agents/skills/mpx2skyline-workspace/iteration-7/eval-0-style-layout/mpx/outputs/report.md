# style-card 微信双 renderer 适配报告

已交付完整 `style-card.mpx`，保持组件 `title: String` 接口及默认值、原文案和 `component:true`。输入目录无其他业务文件。仅输出 wx，WebView 与 Skyline 通过运行时 `renderer` 区分，未添加页面专属配置；依赖任务约定的宿主 `defaultDisplayBlock/defaultContentBox`。

## 适配结果

- 标题保留 WebView 单行省略 CSS，补 `max-lines=1`、`overflow=ellipsis`；两列标签用横向 Flex 各占 50%；活动文案改用 `.sale` 类保持 `#d00`。
- WebView 媒体查询仅匹配其专用 `.card-webview`，防止 Skyline 忽略条件后的样式泄漏。Skyline 使用 `.card-small`；窗口 `<=320px` 为 `12rpx`，其他为 `24rpx`。两模式均初始化读取窗口宽度、监听 resize、卸载时按同一回调注销，不误删其他实例监听。
- `.outer` 用 `padding-top:20px` 表达内部留白，清除 child 顶部 margin；child 保持 `100px` 内容宽、四边 `10px` padding，显式 content-box，外宽 `120px`。子盒顶部偏移 `20px`，内容顶部偏移 `30px`。兄弟两块间距统一由第一块 `margin-bottom:16px` 表达。
- 单个 rgba 阴影、独立 `blur(2px)` 原样保留。双阴影拆同尺寸嵌套盒，黑色较近阴影在内、灰色较远阴影在外；复合滤镜内层先 blur、外层再 brightness，保留两种效果及处理顺序。共用结构应用于两模式，无删除效果或改变设计参数。
- 提示条的 `height:92rpx`、`padding-bottom:92rpx`、`margin-bottom:-28rpx` 与内容卡片 `margin-top:-92rpx` 均保留。占位链 `.overlap-host/.tips-wrapper` 显式纵向 Flex，两模式采用同一占位计算：提示分支 `92+92-28=156rpx`，内容卡片顶部相对该组起点为 `64rpx`。这是静态布局推导，未作为微信实测数据。旁边 `.simple-next` 保留单侧 `-8rpx`，未改其父布局。
- 保留横向 scroll-view、`type=custom` 和 enable-flex，明确 row 方向及 `38px` 高度；直接内容容器 `width:100%` 铺满 `320px` 视口与背景。内部两短项以零 basis 等分，预期各 `160px`，不靠子项反向撑开父节点。

## 字体核验与风险

City-Semibold 在组件中已有同名独立 `@font-face`，保留字体族、`600` 及 `./city.woff2` 引用；无需按字体名后缀改写为 City。Trip-Medium 来自宿主，保留字体族与 `500`，没有擅改为 Trip/bold/700。任务要求沿用已确认设计，不包含进一步字重视觉调整授权。

输入未提供任何字体二进制，因此不能检查 name table 的 family/PostScript name、真实 weight、中文字符覆盖和宿主 Trip-Medium 注册信息。部分 iOS/Android 机型对 500/600、独立字体族匹配及字体回退可能不同；实际粗细、行高和标题截断点需带真实字体分别核验。保留这些已说明的字体风险，未宣称字体视觉通过。

## 验证与证据

证据均在 `../run-1/`，总入口为 `validation.json`。

| 验证类别 | 结果 | 证据与边界 |
| --- | --- | --- |
| 静态 ESLint | pass | `eslint.log`，检查最终业务组件 |
| 完整适配矩阵 | reviewed，有字体风险保留 | `audit-matrix.json` 逐规则记录；`static-scan.log` 为矩阵聚合扫描。范围仅该组件，页面/全局配置、未出现的能力不适用；未提供宿主调用方 |
| Jest 静态结构 | pass，6 项 | 检查媒体规则隔离、节点关系、尺寸声明、接口、阴影及滤镜结构；不是渲染测量 |
| Jest mock | pass，10 项 | 两 renderer 各覆盖 319/320/321/375px 初始化、跨断点 resize、多实例及卸载清理。`style-card.test.cjs`、`jest.log`、`jest-results.json`；VM 执行实际脚本但 mock 注册和窗口 API，不证明 Mpx 原生响应式或排版 |
| wx 真实编译 | failed | `compile-wx.log`、`compile-wx.json`；执行 `npm run compile-validate -- iteration-7/eval-0-style-layout/mpx/outputs/style-card.mpx --target=wx --json`。缺少宿主 `city.woff2`，产生同源的两条 dependency 错误；没有删除字体规则或伪造资源绕过 |
| 微信开发者工具 WebView / Skyline | not_run | 无可运行宿主及开发者工具会话 |
| 真机 WebView / Skyline | not_run | 无连接设备及字体二进制，视觉一致性未实测 |

Jest 首次启动因 Watchman 状态目录权限失败，保留 `jest-attempt-1.log`；关闭 Watchman 后一次修复即通过。共 16 项检查通过，真实编译一次失败，未反复尝试缺失资源。

后续宿主验收：提供同路径真实 City 字体及 Trip 注册，在 WebView 与 Skyline/glass-easel 分别检查超长标题、320px 边界与旋转/窗口变化、20/30/120px 盒模型、16px 间距、提示条重叠、普通 8rpx 回拉、横向背景铺满与等分项，以及阴影、滤镜和品牌字体。编译成功也不能替代这些视觉验收。
