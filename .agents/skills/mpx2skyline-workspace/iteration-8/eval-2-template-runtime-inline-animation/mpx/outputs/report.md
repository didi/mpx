# 微信 WebView / Skyline 适配报告

交付 `user-list.mpx`、`row.wxml`、`logo.svg`。目标仅 wx，WebView / Skyline 共用业务实现；未引入其他平台条件文件。仅使用指定 iteration-8 Mpx Skill 快照。

## 实现

- 标题以微信 span 承载同段 image + text，设置可收缩宽度及 `max-lines=1` / `overflow=ellipsis`；Skyline 图片显式 inline-block，WebView 保留 nowrap、hidden、text-overflow，图标采用 aspectFit。SVG 原样保留数值尺寸、坐标与内联颜色。
- 提示圆点为标题旁真实 view，8px、#f50、4px 圆角；保留原先 1 秒 ease、透明度 0.3→1 的正向重复周期，fill-mode 改 both，初始 opacity=0.3。没有改为往返两秒周期。
- `items` 初始为空数组，`initData.visibleItems` 保护首帧；computed 对 null 返回空数组，对数组只保留 visible 用户。`setRows({items})` 接口保留。外部 row.wxml 改具名模板，循环显式传递 item/index，行号沿用原始 0 基并按过滤后列表连续编号。
- `users` 替代数字开头 id，实际列表自身开启 enhanced；按钮通过实例查询 `#users` 的 ScrollViewContext 并调用 `scrollTo({top:0})`，不会选中 `other`。列表项保持直接子节点，两个容器保留 300px 高度。
- 同一回顶按钮以 pressed 动态类切换 scale(0.96)/opacity(0.7)，松开或取消恢复 1；transform/opacity 均为 150ms ease 过渡，移除动画 API。
- 文本详情保留 navigator；卡片详情以 view 点击调用 navigateTo，目标均为 `/pages/detail`。label、payload 的声明/默认值及 `config.default='keep'` 保留。

## 验证与边界

| 层次 | 结果 | 证据 |
| --- | --- | --- |
| 完整检查矩阵与静态结构 | passed，48 条逐项复核，无未解释 error | `../run-1/audit.md`、`static-audit.json` |
| ESLint | passed，退出码 0 | `../run-1/eslint.log` |
| Jest 静态／mock | passed，14/14 | `../run-1/user-list.test.cjs`、`jest-results.json`、`jest.log` |
| 真实 Mpx 编译 | passed，显式 target=wx，0 error / 0 warning | `../run-1/compile.log`、`compile-result.json` |
| 微信开发者工具 | not_run | 未提供可运行的宿主页／工具会话 |
| WebView 真机 | not_run | 真实视觉、触摸、滚动及跳转待验证 |
| Skyline/glass-easel 真机 | not_run | 真实视觉、触摸、滚动及跳转待验证 |

首次 Jest 启动因沙箱内 Watchman 状态目录 fchmod 权限失败，未进入用例；保留 `jest-attempt-1.log`，第二次命令关闭 Watchman 后通过，无业务代码修复。未超过三次修复上限。

mock 覆盖初始化／返回前、null／数组更新、visible 过滤与行号、目标列表查询及回顶调用、卡片跳转、按下／松开／取消状态。文本 navigator、事件绑定、共同截断、动画数值由静态断言核对；它们不代表真实组件事件或布局已验证。共用 wx 编译通过不能证明两种 renderer 真机体验。编译使用环境既有 core→runtime-core 别名，未验证完整生产 Mpx 运行时。

组件 JSON 仅保留 component:true。宿主页 Skyline/glass-easel 接入按已确认前提处理；未提供 app/page 文件，未核验宿主推荐的 defaultDisplayBlock、defaultContentBox、tagNameStyleIsolation、enableScrollViewAutoSize、keyframeStyleIsolation，未擅自改环境配置。关键帧与调用位于同一组件并使用专属名称，仍需宿主确认作用域。未提供调用方，payload 的实际传值未做宿主联调。

真机待验：分别挂载于 WebView 与 Skyline，传长 label 和多行用户；检查图文共同单行省略、圆点一秒循环；滚动 users 与 other 后按回顶，确认仅 users 归零；分别按下后松开、按下后取消，检查 150ms 恢复；点击两个详情入口确认到达目标页。完整分层状态见 `../run-1/validation.json`。
