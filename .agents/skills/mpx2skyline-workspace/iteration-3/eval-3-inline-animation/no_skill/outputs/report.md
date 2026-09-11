# 适配结果

完整业务文件：`promo-card.mpx`、`logo.svg`。组件继续依赖宿主页已有的 Skyline/glass-easel 配置。

- 运行时通过组件 `renderer` 选择 Skyline 分支；图标和标题共同置于 span 截断容器，限制一行，保留外部 SVG。
- Skyline 用真实 8px 圆点替代伪元素，worklet 将透明度从 0.3 动画至 1，周期 1000ms、无限重复、不往返。
- Skyline 按下缩放至 0.96、透明度至 0.7；结束和取消均恢复至 1，时长 150ms。移除该分支的 animation 属性，组件销毁时取消动画。
- WebView 保留原图文容器、CSS 关键帧及 createAnimation 行为。

验证：Jest 5/5 通过，覆盖动画参数、恢复、销毁取消、WebView 分支、SVG 字节一致性与 JSON；Babel 脚本解析及 ESLint 检查通过。证据位于相邻 `run-1` 目录。

未验证：微信开发者工具与真机均为 **not_run**。模拟测试不能证明宿主 API 可用性、Mpx 实例的 renderer/applyAnimatedStyle 代理、worklet 编译配置或 span 实际排版。需在已启用 worklet 编译的目标工程验证长标题和极窄容器的共同截断、SVG 展示、连续快速按压/取消以及圆点重复周期。其他目标平台没有构建验证。
