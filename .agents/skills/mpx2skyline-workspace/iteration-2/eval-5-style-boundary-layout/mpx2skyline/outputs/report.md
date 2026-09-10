# 数据面板 Skyline 适配

交付范围仅 `data-panel.mpx`，保留组件 JSON 和原业务文本。宿主页已配置 `defaultDisplayBlock/defaultContentBox`，不改 app 或页面配置。

- `.outer` 用 `padding-top: 20px` 承担原首项外沿间距，去掉 child 的 margin；保留 `overflow: hidden` 仅作裁剪。
- child 显式使用 `content-box`，内容宽 100px，加左右各 10px padding，外框宽 120px。
- 两块之间只保留第一块 `margin-bottom: 16px`，避免 Skyline 将原 16px、12px 相加。
- 单阴影及单 blur 保留；双阴影拆成同尺寸嵌套节点，保留黑色前层和灰色后层。复合滤镜拆成内层 blur(2px)、外层 brightness(.8)，保留作用顺序与两个效果。
- 两个 navigator 保持 `/pages/detail`；卡片详情的子节点改为 text，符合 Skyline 的嵌套限制。

字体族、字重和 `./city.woff2` 路径均保持原样。City-Semibold 已有同名独立 `@font-face`，不作 PostScript 名称替换。Trip-Medium 由宿主提供，无法检查其独立字体族定义与 PostScript 映射。600/500 在部分 Skyline 机型可能不生效；按任务约束只报告，不更换字体或字重。输入不含字体二进制，交付也未伪造资源；集成时继续使用宿主原字体资源。

验证：完整复核适配矩阵 47 条，聚合扫描证据和逐项说明位于 `run-1/aggregate-scan.txt`、`run-1/audit.json`。字体相关 error 候选以已定义字体族或用户禁止改动作为例外，warn 保留字体真机风险；阴影、滤镜候选已核对为每节点单层/单函数。其余规则无未说明残留。

执行了脚本 ESLint（语法、未定义/未使用变量、引号、分号）和 Jest 核心静态验证，4 项测试通过，无修复重试。测试校验显式间距、120px 盒模型、效果结构和顺序、导航目标与字体保持。

未执行宿主完整构建、微信开发者工具或 WebView/Skyline 真机视觉验证；静态通过不代表实机验收。仍需在宿主核验 20px 外沿间距、120px 宽度、16px 块间距、两层阴影与滤镜的实际绘制、两处导航点击，以及字体加载和实际字重。
