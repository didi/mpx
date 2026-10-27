# style-card 微信双 renderer 适配报告

已交付完整 [style-card.mpx](./style-card.mpx)，保留 `title: String`、默认标题和组件声明。范围为输入目录唯一业务组件，目标仅微信 WebView / Skyline；无业务子组件或调用方输入。按指定 `mpx2skyline/SKILL.md` 及相关参考实施，未加载其他 Skill、其他组知识或历史产物。宿主已开启 `defaultDisplayBlock/defaultContentBox`，本组件无需添加页面配置。

## 适配结果

| 需求 | 实现与检查 |
| --- | --- |
| 长标题单行省略 | 保留 WebView `white-space/overflow/text-overflow`，在实际 `text` 上补 `max-lines="{{1}}" overflow="ellipsis"`，插值紧贴标签。 |
| 两列等宽、活动红字 | Grid 改为横向 Flex，两个标签各 `width: 50%`；属性选择器改为 `.badge-sale`，保留 `#d00`。 |
| 窗口断点 | WebView 独占 `.card-webview` 媒体查询类；Skyline 初始读取 `getWindowInfo().windowWidth`，通过 `onWindowResize` 更新 `.card-small`。两端均为 `≤320px → 12rpx`、`>320px → 24rpx`。 |
| 卸载清理 | Skyline 实例保存自身 callback，`detached` 使用同一引用调用 `offWindowResize` 后释放引用。WebView 使用原生媒体查询，无运行时监听。 |
| outer/child | 顶部间距由 `.outer { padding-top: 20px }` 承担；child 保留四周 `10px`，显式 `content-box`，内容宽 `100px`、外宽 `120px`。child 盒顶距 outer 上外沿 `20px`，内容顶距其 `30px`。 |
| 两块间距 | 第一块底部 `16px`，第二块顶部清零，消除双端 margin 折叠差异，间距统一为 `16px`。 |
| 阴影与滤镜 | 单个 rgba 阴影及独立 `blur(2px)` 原样保留。双阴影拆为同尺寸嵌套节点：外层 `#333` 后层、内层 `#000` 前层；复合滤镜拆为内层 blur、外层 brightness，保持先模糊后调亮度的合成顺序。 |
| 提示条重叠 | `.overlap-host` 与 `.tips-wrapper` 显式纵向 Flex，保留 `92rpx` 高度、`92rpx` 底部 padding、`-28rpx` 底部 margin 和内容卡片 `-92rpx` 顶部 margin。额外用 wrapper 的 `28rpx` 底部 margin 补偿原 WebView 折叠差值，保持原相对位置，避免统一 Flex 后多回拉 `28rpx`。 |
| 普通回拉 | `.simple-next { margin-top: -8rpx }` 保留，父容器保持普通块布局。 |
| 横向标签区 | 保留 `scroll-x/enable-flex/type="custom"`；视口宽 `320px`、高 `38px`，直接子容器明确 `width:100%`、横向 Flex，两个短项以零基准等分为各 `160px`，背景铺满视口。 |

重叠区静态几何核对（单位 rpx，相对 overlap-host 顶部）：原 WebView 的负 margin 折叠模型为 `92 + 92 + min(-28, -92) = 92`；适配后的显式 Flex 模型为 `92 + 92 - 28 + 28 - 92 = 92`。内容卡片顶部保持 92、底部保持 212；这些是规则推导和测试模型，未作为原生渲染实测。

## 字体核验与依赖

- `City-Semibold` 已由组件内独立 `@font-face` 定义为字体族，保留名称、`./city.woff2` 映射与 `font-weight: 600`，无需擅自改成 `City/bold`。
- `Trip-Medium` 由宿主提供，保留原字体族与 `font-weight: 500`。输入未包含宿主注册代码，无法确认其实际 family/PostScript name 映射。
- 输入目录只有 task.md 与 style-card.mpx，没有字体二进制。未核验二进制中的 PostScript name、字重表、完整性或实际加载结果；未生成替代字体或修改设计字重。
- 按任务约定，宿主集成时须提供可由相对路径解析的真实 `city.woff2`，并完成 Trip-Medium 的加载。500/600 在部分机型可能无法匹配预期字重，需用真实字体在目标 iOS/Android 设备核验，不能以静态定义或 mock 断言认定品牌字体效果已通过。

## 验证结论

详见 [validation.json](../run-1/validation.json)。验证文件仅写入本组 run-1。

| 层级 | 结果 | 证据与边界 |
| --- | --- | --- |
| 静态审计 | passed，附字体例外 | [48 条完整矩阵复核](../run-1/audit.json)、[聚合扫描](../run-1/audit-scan.log)。无未说明 error；媒体查询已限定 WebView，City 独立字体族属于例外，Trip 与 500/600 按确认设计保留并记录风险。 |
| ESLint | passed | 对交付 `.mpx` 运行 `npm run lint -- <交付文件>`，退出码 0；[日志](../run-1/eslint.log)。 |
| Jest / mock | passed，14/14 | [测试源码](../run-1/style-card.test.cjs)、[日志](../run-1/jest.log)、[原始 JSON](../run-1/jest-results.json)。覆盖初始宽度 319/320/321/375/640、动态跨断点、callback 清理、实例独立、WebView 隔离和样式/几何模型。VM mock 不包含 Mpx 原生运行时或微信排版引擎。 |
| 真实 wx 编译 | failed：宿主字体依赖缺失 | 使用同一基础 `npm run compile-validate -- <交付文件> --type=component --no-ignore-sub-components --json`，退出码 1；[完整日志](../run-1/compile.log)、[编译 JSON](../run-1/compile-result.json)。两条 dependency 错误均源于 `Can't resolve './city.woff2'`，warnings 为 0。对原样交付文件执行一次，未以删去字体声明的副本代替验证，也未将编译记录为成功。 |
| 微信开发者工具 | not_run | 未启动微信预览，未执行 glass-easel 原生渲染验证。 |
| 真机 | not_run | 未连接微信宿主设备；双端视觉、品牌字体加载、滚动手感与实际 resize 行为仍待验收。 |

Jest 首次启动因沙箱无法访问 Watchman 状态目录而失败，保留 [首次日志](../run-1/jest-attempt-1.log)。仅在 run-1 的 Jest 配置中关闭 Watchman 后通过，共一次修复；未修改环境配置。真实编译的缺失字体由宿主提供，未重复重试相同失败。

宿主补齐字体后的验收：重新运行真实 wx 编译；分别在 WebView/Skyline 中检查长标题、省略位置、红字、阴影滤镜及品牌字体；以 319/320/321px 跨断点改变窗口并检查 padding；核对 child 的 20/30/120px 几何、16px 间距、提示条相对位置和普通 8rpx 回拉；检查 320px 横向区域背景与两项宽度；反复挂载卸载并确认监听清理。编译成功也不能替代这组原生视觉验收。
