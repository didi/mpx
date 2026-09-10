# 交付说明

`rating-selector.mpx` 为完整 Mpx 选项式组件，内含 `component: true` 的 JSON 区块，无新增依赖。

- 属性：ratingKey、value（0）、max（5）、readonly（false）、label（评分）。
- 根据 max 生成单行等宽星号；点击第 n 颗更新本地评分，并发出 change，detail 为 `{ ratingKey, value: n }`。
- value 的属性 observer 同步父级更新；attached 同步初始值。readonly 禁止评分更新、事件发送与按压态。
- touchstart 设置按压态，touchend / touchcancel 恢复；缩放 0.96，过渡 150ms。
- 标签使用单行省略样式及 max-lines="1"，组件仅使用 view/text 和基础 flex 布局。

## 接入

宿主页面通过 usingComponents 引用本组件，绑定 `value`、`max` 等属性和 `bindchange`。WebView / Skyline 由宿主页面或应用的 renderer 配置决定；Skyline 宿主还需配置 glass-easel 组件框架。组件不承担页面配置或滚动职责。

## 实际验证

执行 `node outputs/verify.cjs`，退出码 0。验证脚本以 Node VM 执行 SFC 脚本，检查属性默认值、初始值、动态 max、按压恢复、点击评分、change payload、父级更新、readonly，以及 JSON 与关键模板/样式字符串。

未执行 Mpx 编译、仓库 ESLint / Jest 或微信开发者工具；本交付目录没有独立构建工程，未引入依赖。上述检查不等同于真实 Mpx 响应式集成或渲染验证。

待宿主工程验证：分别使用 WebView / Skyline，检查长标签省略、不同 max 下的单行等距、150ms 缩放过渡、触摸取消恢复、父级更新及 readonly。极窄容器与非常大的 max 下需额外确认星号可读性。
