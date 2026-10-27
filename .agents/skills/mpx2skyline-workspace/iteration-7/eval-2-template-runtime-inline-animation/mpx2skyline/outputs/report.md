# 用户列表 Skyline 适配报告

## 交付与范围

完整业务文件为 `user-list.mpx`、`row.wxml`、`logo.svg`，三者保持同目录。仅覆盖微信 wx 平台 WebView / Skyline 的本组件及外部行片段、图标资源。宿主页接入 Skyline/glass-easel 按任务已确认条件处理；未读取、修改或验证宿主页、app.json、构建配置和 `/pages/detail` 页面实现。

仅使用指定 mpx2skyline Skill 及本组相关 references；真实编译使用获准的基础工具。未修改 input、Skill 或环境配置。

## 适配结果

- 标题图标与 label 放入同一 `mpxTagName@wx="span"` 内联容器，配置 `max-lines=1`、`overflow="ellipsis"`，以 flex 和明确宽度约束可用空间；保留 WebView 单行省略样式。图标使用 `aspectFit`，原 SVG 数值尺寸与内联颜色无需修改。
- 提示圆点放到标题旁的真实节点，保持 8px、#f50 和原有每 1 秒从透明度 0.3 到 1 的循环，不增加 alternate 或改变周期；fill-mode 改为 both，初始透明度显式为 0.3。
- 使用 `initData.visibleItems=[]` 保护 computed 计算前的模板，`items` 默认空数组，`setRows({items:null})` 归一为空数组。正常数组仍只过滤 visible 用户。过滤后从 0 起编号，沿用原 index 展示约定。
- 外部片段改为 import 加具名 template，显式传入过滤后的 index、item。循环行是列表直接子节点。
- 用户列表改为合法 id `users` 并开启 enhanced。实例级查询明确选择 `#users` 后获取 ScrollViewContext，调用 `scrollTo({top:0})`；保留旁边的 `other` 容器区分目标。
- 同一回顶按钮用 `pressed` 动态类驱动双端共用 CSS transition；按下 scale(0.96)、opacity 0.7，松开/取消恢复 1，两属性均过渡 150ms。移除动画 API。
- 文本详情入口保留 navigator；卡片改为外层点击事件调用 `wx.navigateTo`，两者均指向 `/pages/detail`。保留 label、payload 的类型/默认值及 `config.default='keep'`。

## 验证结果

证据位于相邻 `../run-1/`，汇总见 `validation.json`。

| 层级 | 状态 | 证据与边界 |
| --- | --- | --- |
| 静态检查 | pass | ESLint 无错误；5 项模板/样式断言通过；完整审计矩阵 48 条逐条扫描与复核，见 `eslint.log`、`audit.json`、`audit-scan.log` |
| 运行时 mock | pass | 10 项通过，覆盖两种 renderer 值下的初始化、null/数组/替换更新、过滤行号、实际模板 id 与查询关联、回顶调用、详情目标、按下/松开/取消；见 `user-list.test.cjs`、`jest-results.json`、`jest.log` |
| wx 真实编译 | pass | `npm run compile-validate -- iteration-7/eval-2-template-runtime-inline-animation/mpx2skyline/outputs/user-list.mpx --type=component --json`，0 errors、0 warnings；见 `compile.log`。这是 wx 构建校验，不是 renderer 运行验收 |
| 开发者工具运行 | not_run | 未启动微信开发者工具 |
| 真机渲染与实际交互 | not_run | 未验证 WebView/Skyline 的实际长标题共同截断、SVG 对齐、圆点播放、150ms 过渡、真实页面跳转与真实滚动 |

Mock 直接加载组件选项并调用业务方法，不模拟 Mpx 响应式调度、glass-easel 或原生渲染器。navigator 静态检查目标与子节点结构，卡片 mock 校验 navigateTo 参数，不能据此声称真实跳转通过。长 label 仅验证共同截断的结构/样式约束，未测量屏幕上的省略位置。

Jest 首次启动因沙箱禁止访问用户 Watchman 状态目录而失败；仅禁用本次 Jest 调用的 Watchman 后通过，未修改环境配置。首次失败日志保留在 `jest-attempt-1.log`；共进行 1 次修复重试，无业务测试断言失败。

## 审计与待实机确认

组件范围内无未说明的 error/warn 残留。`config.default` 为普通 data 字段，不是 properties 默认值错误；横向滚动、swiper、选择器和 direction 等候选误报已在逐条审计中解释。

页面/全局配置规则按单组件范围记不适用，宿主配置未作验证。接入时仍需核对宿主的默认布局/盒模型配置以及 `rendererOptions.skyline.keyframeStyleIsolation`；本组件已显式设置主要布局方向、标题宽度和滚动高度。Worklet 未使用，无需增加相关构建配置。

真机待验收：分别在 WebView/Skyline 以窄容器和长 label 检查图文共同单行截断及圆点不压缩；填充足量 visible 用户并滚动用户列表，点击回顶确认仅该列表回到 0；按下后松开/取消检查反馈恢复；点击两个入口确认进入详情页。
