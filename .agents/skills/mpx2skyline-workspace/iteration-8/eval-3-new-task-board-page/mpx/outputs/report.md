# 任务看板交付与验证

交付 `pages/task-board.mpx`、`components/rating-selector.mpx`、`components/segmented-control.mpx`、`app.json`。仅覆盖微信 `wx` 输出的 Skyline / WebView，未实现浏览器 Web 端。本次仅使用指定的 iteration-8 Mpx Skill 快照及其按需参考。

## 实现

- 页面及 segmented-control 使用 `script setup`，显式 `defineExpose`；rating-selector 使用 `createComponent` 选项式 API。两个组件独立文件、`component: true`，页面 JSON 使用相对路径实际注册。
- 初始任务、分类参数（优先采用 Mpx 的 decodedQuery）、筛选数量、完成切换、空态、连续追加均已实现。新任务使用实例内递增 key；刷新不重置生成器，避免后续重复。
- 刷新模拟请求延迟 450ms；成功恢复初始任务、评分归零，失败保留原任务和评分，finally 关闭刷新反馈。加载期间阻止触底追加和重复刷新。刷新保留当前分类。
- 失败注入：取得任务看板页面实例后调用 `page.failNextRefresh()`，再实际下拉或调用模板所绑定的 `page.onRefresh()`；下一次请求失败一次，之后恢复正常。业务列表可继续点击或分页。
- 两个组件均同步父级 value、立即更新本地选择，并派发约定的 change detail。评分只读、分类整体/单项禁用会阻止选择与事件；候选项经过数组归一化，初始化及 null 时安全渲染空列表。
- 每个实例独立保存按压状态；touchstart 应用 scale(0.96)/opacity(0.7)，touchend/touchcancel 恢复，transition 为 150ms。

## Skyline / WebView 适配

顶部自定义导航、筛选及评分在滚动区域之外；容器依据窗口实际 px 高度进行 Flex 分配，尺寸变化时重算，滚动区 `min-height: 0`，scroll-view 有确定的 100% 高度。导航避让状态栏和胶囊；返回有页面栈时 navigateBack，否则 reLaunch 到保留的首页。

唯一纵向 `scroll-view` 显式 `type="list"`，任务是直接子节点。两种渲染模式共用 `bindrefresherrefresh` / `bindscrolltolower`，默认刷新指示器由 `refresher-triggered` 控制。顶部不依赖 CSS sticky、fixed 或层级差异。

全部省略节点同时保留 WebView 的 nowrap/hidden/text-overflow 和 Skyline 的 `max-lines="{{1}}" overflow="ellipsis"`。标题可收缩，星级及分数不收缩，分类候选 Flex 等分且各自省略。无原子 CSS、媒体查询、Worklet 或 WebView 专属动画 API。

app.json 保留首页首项、原 window 和 rendererOptions.webview；增加页面注册、requiredComponents 和 Skyline 五项默认行为对齐配置。页面显式 skyline/glass-easel/custom/disableScroll。WebView 降级共用相同实现；需要强制对照调试时，仅在本地测试副本将页面 renderer 改为 webview，生产交付仍为 skyline，宿主首页继续沿用原配置。

## 真实验证结果

| 类型 | 状态 | 证据与边界 |
| --- | --- | --- |
| 静态检查 | passed | `../run-1/static-validation.log`、`skyline-audit.json`：本页、两个组件、app.json 全部覆盖，逐项复核 48 条矩阵规则；没有无说明的 error。静态结论不代表视觉验收。 |
| ESLint | passed | `eslint-final.log`：业务三个 SFC，0 错误、0 警告。首次 4 条 initData 提示已通过补齐初始绑定解决。 |
| 真实 Mpx 编译 | passed | `compile-final-page.json`：wx 页面递归编译实际子组件；`compile-final-components.json`：两个组件作为组件入口编译。均 0 错误、0 警告。`build-wx/` 保留真实 WXML/JSON/JS/WXSS，已核实注册路径和事件参数生成。 |
| setup 模板绑定 | passed | 真实 Mpx setup 编译器产物保留于 `compiled-scripts/`；mock 挂载后求值实际模板表达式，核对暴露状态、computed 和处理器。 |
| Jest / mock 业务 | passed | `jest-results.json`、`jest.log`：12/12。读取实际 SFC、使用真实 setup 转换，按实际模板的事件绑定调用处理器；响应式由 Vue 2.7 模拟，宿主 API、组件挂载和定时器由测试替身提供，未运行微信渲染器。 |
| 完整宿主 App 构建 | not_run | 输入仅包含 app.json，没有首页源码和 app.mpx；本次完成页面/组件真实编译与宿主配置静态核对。build-wx 是校验产物，不是完整可启动小程序。 |
| 开发者工具 WebView | not_run | 未连接微信开发者工具运行容器。 |
| 开发者工具 Skyline | not_run | 未连接微信开发者工具运行容器。 |
| 真机 WebView / Skyline | not_run | 未连接微信真机；没有将 mock 或编译结果计作真机通过。 |

Jest 覆盖参数合法/非法/缺省及 decodedQuery、筛选、原始任务、完成切换、空列表、成功/失败刷新、失败后继续使用、连续分页和 key 唯一性；组件默认属性、父级连续更新、readonly、整体/单项禁用、空/null/异步候选、精确 change detail、实例隔离、真实注册传参和事件回写，以及触摸结束/取消。

重试记录：首次 Jest 被 Watchman 权限阻止；在 run-1 的测试配置禁用 Watchman 后，修正挂载器的 computed 枚举与父级回写模拟，最终通过。静态检查首次文本嵌套正则跨越闭合 text 产生误报，限定节点边界后通过。失败日志均保留，未超过 3 次修复限制。

复现（所有命令均在用户指定 workspace 根目录执行）：

```sh
node iteration-8/eval-3-new-task-board-page/mpx/run-1/compile.cjs
npm run lint -- iteration-8/eval-3-new-task-board-page/mpx/outputs
node /Users/didi/work/mpx/node_modules/jest/bin/jest.js --config iteration-8/eval-3-new-task-board-page/mpx/run-1/jest.config.cjs --runInBand
python3 iteration-8/eval-3-new-task-board-page/mpx/run-1/static-validate.py
```

仍需在实际宿主对两种 renderer 分别验收：窄屏及横竖屏滚动区域、顶部与胶囊避让、超长标题和选项省略、真实手势下拉反馈、触底连续追加、touchcancel 的动画恢复，以及 glass-easel 原生属性对 null options 的处理。这些项没有用静态布局推导或 mock 结果替代。
