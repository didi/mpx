# 优惠卡片适配说明

完整组件为 `promo-card.mpx`，图标 `logo.svg` 与组件保持同级且内容未改。

- Skyline 使用 `span` 承载图标和文字，设置单行限制和省略；WebView 保留普通容器的行内混排。两个分支均由共同容器裁剪，未将图标拆成独立 flex 子项。
- 组件 attached 根据原生组件实例的 `renderer` 选择分支。宿主页面负责选择 WebView/Skyline；组件 JSON 保持 `component: true`。
- 将圆点从伪元素改为真实节点，保留 1 秒循环的透明度闪烁，移除 `animation-fill-mode: backwards`。
- 按钮用状态类和 CSS transition：按下缩放至 0.96、透明度至 0.7，松开或取消恢复，两项均为 150ms。移除 `wx.createAnimation`，没有引入 Worklet 或依赖。

## 实际验证

通过 Node 执行组件脚本（用桩函数接收 createComponent 配置），检查 Skyline/WebView 两种 renderer 的分支选择，以及 press/release 的状态变化；JSON 解析、touchcancel 绑定、150ms 声明和 SVG 字节一致性检查均通过。

本目录没有完整项目、依赖、构建配置或微信开发者工具，因此没有执行 Mpx 编译、ESLint/Jest 或双渲染器真机验证。上述检查不证明 Skyline 样式实际渲染正确。

接入时需在目标基础库验证：Mpx 实例是否透传 `renderer`；Skyline `span` 的 `max-lines` 单行混排省略及 SVG 展示；两渲染器下长短标题、窄宽容器；圆点持续闪烁；按钮按下/松开/取消和连续快速操作的过渡。若宿主未开启 Skyline，只会进入 WebView 分支。
