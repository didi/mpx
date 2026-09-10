# 适配说明

- 图标与标题共用 `mpxTagName@wx="span"`，由同一容器进行单行截断；WebView 保留省略 CSS，Skyline 使用 `max-lines` / `overflow` 与图片 `inline-block`。
- 闪烁由伪元素移到真实 `.pulse` 节点，保留 1s、opacity 0.3→1 循环，fill-mode 改为 both；补圆角落实圆点外观。
- 按下缩放 0.96、透明度 0.7，松开或取消恢复 1；以 150ms linear transition 替代 wx.createAnimation，符合原 API 默认线性时序。不引入 Worklet 或依赖。
- logo.svg 保持原文件：固定尺寸和内联 fill，无 SVG 兼容性差异写法。

验证：完整 47 项适配矩阵扫描及结构复核记录于 run-1/audit.json；脚本 ESLint 通过，Jest 2 项通过（两种 renderer 的初始化与按下/恢复）。无未处理 error；混排、动画、SVG 等 warn 候选均已复核说明。

范围仅 promo-card.mpx 与 logo.svg。组件任务不修改 app.json、页面或构建配置。宿主配置未提供，集成时需核对 rendererOptions.skyline，尤其 keyframeStyleIsolation；本组件关键帧在本地定义。未执行微信编译、开发者工具或真机验证，仍需在两种渲染器下核验长标题/窄容器共同截断、图标对齐、1s 闪烁、150ms 按下/松开/取消及快速反复触摸。
