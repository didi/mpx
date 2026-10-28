# 适配与验证报告

交付 `style-card.mpx` 完整组件，保留 `title: String`、默认标题和组件 JSON。输入目录仅有该组件与 task.md，无其他业务依赖文件。仅覆盖微信 `wx` 的 WebView / Skyline；只使用指定 `iteration-8/skill-snapshots/mpx` Skill 与所需 references，未读取其他组知识、评分文件或历史产物。

## 适配结果

- 长标题保留 WebView 单行省略 CSS，同时增加 `max-lines="{{1}}"` / `overflow="ellipsis"`。两列标签使用等分 Flex，活动文案使用 `.sale` 类保持红色。
- 卡片默认 `24rpx`；WebView 的媒体查询限定到 `.card-webview`，避免 Skyline 忽略条件时泄漏。Skyline 用实例 `renderer` 与 `isSmall` 类控制同一 `windowWidth <= 320px` 断点。两模式均初始化窗口宽、监听 `onWindowResize`，卸载时用同一函数注销；不使用 screenWidth。
- outer 以 `padding-top:20px` 提供内部留白；child 无顶部 margin，保留四周 `10px` padding 和 `100px` 内容宽。故 child 顶距 20px、内容顶距 30px、含 padding 外宽 120px。第一块仅保留底部 16px，第二块顶部归零，保持原 WebView 折叠后 16px 间距。
- 单个 rgba 阴影与独立 blur 原样保留。双阴影拆为同尺寸嵌套块：外层大阴影、内层小阴影，保持原前后顺序；复合滤镜内层 blur、外层 brightness，保留先 blur 后 brightness 的顺序。无需按 renderer 拆分共享实现。
- 横向 scroll-view 保留 `scroll-x`、`enable-flex`、`type="custom"`，显式横向布局；直接内容节点设 `width:100%`，背景铺满 320px 视口，两短项 `flex:1` 等分，理论每项 160px。没有用内部 min-width 反向撑开内容节点。

## 重叠布局基线（静态推导，未实测渲染）

以下坐标相对 overlap-host 顶部，单位 rpx，基于宿主 `defaultDisplayBlock/defaultContentBox` 前提。

| 指标 | 原 WebView 块流 | 适配后 WebView / Skyline 纵向 Flex |
| --- | --- | --- |
| 提示条含 padding 的外高 | 92 + 92 = 184 | 184 |
| tips-wrapper 分支 | 盒高 184，末子项负底 margin -28 向外折叠 | 子项 -28 参与占位，wrapper 高 156 |
| 内容卡片顶部 | 184 + min(-28, -92) = 92 | 156 - 64 = 92 |
| 与提示条重叠高度 | 184 - 92 = 92 | 92 |
| 内容卡片底部 / 后续流起点 | 92 + 120 = 212 | 212 |

`.overlap-host` 与 `.tips-wrapper` 均显式纵向 Flex，提示条保留原高度、底部 padding 和 `margin-bottom:-28rpx`；内容卡片顶部改为 `-64rpx`，补偿取消负 margin 折叠产生的 28rpx 差值。普通 `.simple-next` 仍为 `margin-top:-8rpx`，其父节点不改 Flex；24rpx 前块后回拉8rpx，后项顶部为16rpx。

## 字体核验与剩余风险

City-Semibold 已有同名独立 `@font-face`，保留其 `./city.woff2` 引用及 `600`，不将独立字体族擅自改为 City/bold。Trip-Medium 来自宿主，保留名称与 `500`，未改为700或其他视觉方案。

输入未提供字体二进制，因此资源完整性、字体内部 family/PostScript name 映射、字形覆盖及真实字重均为 `not_run`。部分 iOS / Android 微信机型可能对500/600或 PostScript 名匹配异常；需宿主补齐组件相邻 `city.woff2`、确认 Trip-Medium 注册及组件可见范围，再用批准的设计在两种 renderer 下对比字形、粗细与截断。没有用替代字体或伪造字体文件通过编译。

## 验证记录

证据位于同级 `../run-1/`，汇总见 [validation.json](../run-1/validation.json)，逐条矩阵见 [audit.json](../run-1/audit.json)。

| 验证层级 | 结果 | 证据与边界 |
| --- | --- | --- |
| 静态检查 | pass_with_warnings | 指定组件的完整48条矩阵复核；字体保留例外与机型风险已说明，app/page 属单组件范围例外。静态扫描、CSS/盒模型断言不等于实际渲染。 |
| ESLint | pass | `eslint.log`、`eslint-result.json`；正式组件使用现有工程配置，退出码0。首次 CLI 路径定位错误已修正，无配置变更。 |
| Jest / mock | pass，8/8 | `style-card.test.js`、`jest.log`、`jest-result.json`；覆盖320边界、窗口更新、双模式类、多个实例独立卸载及静态布局/样式。首次 Watchman 权限错误发生于测试前，关闭 Watchman 后通过，仅1次修复。 |
| 正式文件真实 wx 编译 | **fail** | `compile.log`、`compile-result.json`；命令 `npm run compile-validate -- iteration-8/eval-0-style-layout/mpx/outputs/style-card.mpx --target=wx --json`，退出码1。缺 `./city.woff2` 产生两条 dependency 错误（wxss 与 extractor 同源）。保留宿主资源契约，未重复无效重试。 |
| 诊断副本真实 wx 编译 | pass | `font-external-diagnostic.mpx` 仅移除 `@font-face` 声明，真实编译0错误0警告；日志为 `compile-diagnostic.log`。只能说明排除该资源后的代码可编译，不能替代正式文件编译通过或字体加载验证。 |
| WebView / Skyline 真实渲染 | not_run | 无微信开发者工具会话及可运行宿主业务页面；未声称重叠、阴影和滤镜视觉已实测。 |
| 真机 | not_run | 无真机；字体、rpx取整、横向触摸滚动与滤镜/阴影采样需实机核验。 |

宿主已配置的两项默认盒模型直接沿用，组件 JSON 未加入页面专属配置。未提供宿主 app/page 及调用侧，未扩大范围读取或构造父子业务关系；唯一 title 属性声明和值类型一致，真实调用侧传值仍未实测。

宿主验证应分别在 WebView / Skyline 检查：窗口319/320/321/375px及往返变化、超长标题、两列等分、20/30/120px盒模型与16px间距、92rpx重叠和212rpx后续起点、普通8rpx回拉、320px横向背景及两项160px、全部阴影/滤镜效果与品牌字体。当前布局结论为静态推导；完整上线验收仍依赖上述缺失的宿主字体与真实运行证据。
