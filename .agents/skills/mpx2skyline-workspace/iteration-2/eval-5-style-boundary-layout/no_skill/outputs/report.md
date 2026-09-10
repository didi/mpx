# data-panel 双渲染适配

交付完整组件 `data-panel.mpx`。宿主已有的 defaultDisplayBlock/defaultContentBox 配置未修改。

- 将 outer 的 `overflow:hidden` 和 child 的顶部 margin 替换为 outer 的顶部 padding 20px，使 child 外沿距父顶部 20px，不依赖 WebView BFC 或两种渲染器不同的 margin 折叠行为。child 自身 10px padding 保留，文字起点距 outer 顶部为 30px。
- 显式设置 child 为 border-box、width 120px、padding 10px，内容宽 100px，含 padding 总宽 120px。
- first 保留 margin-bottom 16px，second margin-top 设为 0，块间距统一为 16px。
- 单阴影保持原样。双阴影分到等宽嵌套块：外层绘制 0 4px 8px #333，内层绘制 0 2px 4px #000，保留两层及前后顺序。
- 单 blur 保持原样。复合滤镜拆为内层 blur(2px)、外层 brightness(.8)，保留先模糊后调亮度的效果组合。
- 两个 navigator 均替换为绑定同一 goDetail 方法的 view，通过 wx.navigateTo 跳转 /pages/detail，保留原 text/view 内容。
- City-Semibold、Trip-Medium、600/500 字重与 ./city.woff2 路径完全保留，没有替换字体资源。

## 真实验证与限制

已执行 Python 静态断言并通过：组件 template 边界、组件 JSON 可解析、两处点击绑定与导航目的地、盒模型声明和间距、三层阴影声明、三层滤镜声明、原字体族/字重/资源路径。

输入只有单个组件和任务说明，没有可运行宿主、依赖配置、微信开发者工具或字体二进制，因此未运行 Mpx 编译、eslint、jest 或 WebView/Skyline 真机渲染。静态检查不代表真实渲染验收通过。

需要在宿主上验证：两种渲染器的 120px 宽度、20px 顶部外沿间隔、16px 块间隔；嵌套阴影与滤镜的组合效果、目标基础库对 brightness 和 blur 的具体支持；点击两处详情都能打开已注册的页面。若目标 Skyline 基础库不支持某滤镜，当前拆节点方案仍需进一步适配，不能视作已消除此风险。

字体风险仅报告：宿主需确保 City-Semibold 的 woff2 资源可加载，以及 Trip-Medium 已注入；两种渲染器的字体格式支持、实际字体匹配及 600/500 字重映射需真机检查。此次没有改字体声明，也没有使用系统字体、图片或改字重作为替代。
