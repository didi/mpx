# 详情切换组件需求

新建 detail-switcher.mpx，props 为 title:string、disabled:boolean、activeKind:string（basic-card 或 vip-card）、coverUrl:string。父级依次修改 title、disabled、activeKind，子组件必须响应，不得仅初始化时生效。

采用 `<script setup>`。模板显示 title、点击次数与一个“操作”按钮，disabled 时按钮不增加次数、不发事件。启用后点击事件为 change，detail 是 `{count:number, kind:string}`；父组件应展示收到的实际数据。不依赖 dataset，须展示模板到处理器再到父组件的完整事件链。

动态区域只能在 basic-card、vip-card 两个已注册组件间切换。两者都接收 title 并展示。父层累计点击次数不随切换而重置；不把 view/text 当自定义候选。

背景所在节点首次 coverUrl=''，稍后变成远程图片地址；使用 view 的动态 background-image 保留该设计，不能用 image 替代本题待考能力。另一个真实 view 首次无 transition，点击展开后设置 opacity 过渡，再折叠。RN 必须在各能力首次使用前就具备渲染能力，并只对相应节点开启；其他端不应收到 RN 专有属性。

组件挂载后异步取一个演示配置，配置完成后显示 ready；需要 onMounted/onUnmounted 记录日志与清理本实例定时任务。请在本地 Promise 模拟异步配置。页面可能在配置返回前被卸载。

演示输入与行为均为本地数据，不需要接入 Pinia、真实登录或复杂样式。
