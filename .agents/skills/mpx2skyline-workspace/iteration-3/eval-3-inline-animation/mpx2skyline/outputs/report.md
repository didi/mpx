# 适配结果

交付完整 `promo-card.mpx` 与原样 `logo.svg`，仅覆盖该组件及其图片资源。输入只读，宿主页已接入 Skyline/glass-easel，未更改全局或页面配置。

- 图标和标题共用微信 span，统一 `max-lines=1` / `overflow=ellipsis`；Skyline 通过实例 renderer 启用 nowrap 与图片 inline-block，WebView 保留原省略样式。宽度约束由 flex:1、width:0、min-width:0 提供。
- 闪烁从伪元素迁至真实子节点，保留 8px、#f50、opacity .3→1、1s infinite 和默认 ease；fill-mode 改为 both，局部关键帧改名以减少冲突。
- 按钮使用 pressed 状态驱动 transform/opacity，按下 0.96/0.7，松开或取消 1/1，双端统一 150ms linear transition，对齐原 createAnimation 默认 linear。
- SVG 保持字节一致，尺寸与填充使用具体值；图片显式 aspectFit，在现有正方形资源与尺寸下保留展示效果。

验证：Jest 4/4 通过；微信模板编译无 error/warn；CSS 和 JSON 解析通过；提取业务脚本的 ESLint Standard 通过。完整 47 条 Skill 审计记录见 `../run-1/audit.md`，未处理 error 为 0。

未验证：微信开发者工具、iOS/Android 真机、WebView 实际渲染与 Skyline 图文截断及动画时序均为 **not_run**。宿主 `keyframeStyleIsolation` 配置未提供，需集成验收确认；本次未宣称完整小程序 webpack 构建通过。其他平台不在当前验证范围。
