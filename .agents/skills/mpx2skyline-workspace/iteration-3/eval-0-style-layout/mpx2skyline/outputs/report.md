# style-card Skyline 适配

已交付完整组件 `style-card.mpx`，范围仅该组件；输入保持只读。宿主已开启 defaultDisplayBlock/defaultContentBox；未修改页面、全局配置或宿主字体资源。

- 长标题保留 WebView 单行省略 CSS，同时增加 Skyline `max-lines="{{1}}" overflow="ellipsis"`。
- 两标签改为 Flex 等宽两列；活动文案通过 `.badge.sale` 保持 `#d00`。
- WebView 保留 max-width:320px 媒体查询。Skyline 使用 attached 中的 renderer 判断及当前 screenWidth 快照，小屏类仅在 ≤320px 生效，media 后的 Skyline 默认类恢复大屏 24rpx，小屏为 12rpx。无需监听 resize。
- 按“内容距 outer 上外沿20px”的文字要求，outer 顶部 padding 10px，加 child 内部顶部 padding 10px，内容顶部总偏移20px。child 显式 content-box：100px 内容宽加左右各10px padding，外宽120px。两块垂直间距只由 first 的16px margin-bottom承担。
- 单个 rgba 阴影及独立 blur 原样保留；双阴影拆为尺寸相同的嵌套节点，内层承载首层 #000，外层承载后层 #333。没有增添背景、间距或裁剪。
- 复合滤镜拆成内层 blur(2px)、外层 brightness(.8)，保留先 blur 后 brightness 的处理顺序，WebView 和 Skyline 使用相同结构。

## 字体核验与机型风险

| 字体 | 已核验信息 | 未验证与处理 |
| --- | --- | --- |
| City-Semibold | 输入存在同名独立 @font-face，引用 ./city.woff2；woff2 属于 Skill 记录的支持格式 | 字体二进制由宿主提供，输入不含资源；不能核验内部 PostScript name、name 表和实际加载。保留独立字体族及600字重，不改成 City/bold。 |
| Trip-Medium | 原字体族 Trip-Medium、字重500；任务确认来源为宿主 | 输入没有宿主字体声明及二进制，无法确认其是独立注册字体族还是仅 PostScript name。按既有设计保留，未擅改 Trip/bold。 |

500/600在部分 Skyline 机型可能不生效，字体匹配失败时可能回退系统字体，导致字形、字宽、标题截断点或字重变化。宿主集成时需核对两份字体的内部 PostScript name、注册 family 与加载成功状态，并在 iOS/Android 的 Skyline/WebView 对照品牌文本。没有授权改变已确认视觉，不将粗体700作为默认替换。

## 验证

- passed：Mpx SFC 解析、微信模板编译无错误；Jest 7/7，覆盖319/320/321/375px的渲染分支和阈值、几何尺寸与单层阴影/滤镜声明。
- passed：抽取完整业务 script，使用仓库 ESLint Standard 规则校验，最终退出码0。
- completed：完整审计矩阵47条，证据在 `../run-1/audit.md` 与 `audit-scan.log`。media候选已处理；City字体规则有独立字体族例外；Trip映射与500/600风险已记录，无未解释error。
- not_run：微信开发者工具、glass-easel实际挂载、Skyline/WebView真机截图、像素级阴影叠加和滤镜对照、字体加载及机型字重核验。模板解析和样式算术检查不代表真机视觉通过。
- not_run：完整宿主构建（输入未提供字体二进制、app配置和入口）。外部 title 调用值未提供；组件自身默认值为 String，使用合法 value 字段。

业务产物只有本报告和完整 style-card.mpx；所有验证脚本和日志放置于指定 run-1 目录。
