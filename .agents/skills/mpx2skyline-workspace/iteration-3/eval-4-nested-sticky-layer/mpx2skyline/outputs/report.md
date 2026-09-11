# category-panel 适配报告

交付完整 `category-panel.mpx`，保留 sections 属性及 open/close 交互。

- Skyline：用 nested 外层协调嵌套滚动；增加固定 400px 高的 custom 纵向容器承载每组 sticky-section，sticky-header 为首子节点且背景不透明。这样同时满足 Skill 的 nested 外层约束和 sticky 的 custom 容器约束。实际纵向内容滚动由 custom 内层承担，nested 外层同高、无额外内容滚动距离。
- WebView：保留组内 CSS sticky 标题，用独立 renderer 分支避免实例化 Skyline 专属组件。
- 横向列表：显式 list、关联 nested、enable-flex 与 row；项目为直接子节点，宽 120px、高 80px，禁止 flex 收缩。
- 弹层：移出滚动容器，与悬浮按钮成为同级 fixed 节点；z-index 3 高于按钮的 2，点击关闭。删除原 outer 的 transform 和无效层级依赖。
- 组件范围不变，宿主已接入 Skyline/glass-easel；未改页面、app 或仓库文档配置。

验证：Mpx SFC/template 微信编译无诊断；Jest 2 项通过（编译、双 renderer 初始化及弹层开关）；脚本区块按仓库 ESLint 配置检查 0 error / 0 warning。完整 47 条 Skill 检查矩阵已扫描并人工复核，记录在 run-1/audit.md。静态检查无未说明 error；sticky 为 WebView 分支保留，层级与嵌套滚动候选已处理。

真机/开发者工具：not_run。尚未确认三层滚动组合的手势分发、纵向滚动时逐组吸顶与推离、横向长列表的尺寸和弹层触摸覆盖。应在 Skyline/glass-easel 和 WebView 下分别使用超过 400px 的分组内容、每组多于一屏的横向项目验证这些行为；检查弹层覆盖按钮、点击关闭后按钮重新可用。编译通过不代表实际渲染通过。其他平台未验证。
