# 用户列表适配与验证报告

已交付完整 `user-list.mpx`、`row.wxml`、`logo.svg`，目标为微信 `wx` 下的 WebView / Skyline。宿主已接入 Skyline/glass-easel，沿用任务确认范围；组件 JSON 保持 `component: true`，未添加页面专属配置。

## 实现

- 标题图标和 `label` 放在同一个 `mpxTagName@wx="span"` 内，整段设置 `max-lines=1`、`overflow="ellipsis"`，保留 WebView 的单行省略样式。标题占剩余宽度，提示点不收缩；不分别截断图标和文字。
- 圆点改为真实 `view`：8px、圆形、`#f50`，沿用 1 秒、默认 ease 的 `.3 → 1` 无限循环；显式初始透明度 `.3`，fill-mode 改为 `both`。关键帧和使用节点同属组件样式，未引入跨组件关键帧依赖。
- `items` 初始为 `[]`，`initData.visibleItems` 为 `[]`；computed 对 null/undefined 回退空数组再过滤 `visible`。保留 `setRows({items: Array|null})` 契约。
- 外部行片段改为 `import` + 具名 `user-row` 模板，显式传入过滤后的 `index`、`item`。保留原来从 0 开始的行号，列表项为 users 的直接子节点。
- `1users` 改为 `users`；查询改为组件实例 `this.createSelectorQuery().select('#users').node()`，对应 users 明确开启 enhanced。保留独立 other 容器；回顶只调用 users 的 `scrollTo({top: 0})`。
- 同一个回顶控件使用 `pressed` 动态类：按下 `scale(.96)` / `opacity:.7`，松开、取消恢复 1，双向 transition 均为 150ms linear；移除 `wx.createAnimation`。
- 简单详情入口保留 navigator + text；卡片入口改为外层 view 的点击事件，通过 `@mpxjs/api-proxy` 的 `navigateTo` 到 `/pages/detail`。
- 保留 `label`、`payload` 的声明、默认值与联合类型，以及业务数据 `config.default: 'keep'`。SVG 原样交付，数值尺寸/坐标、内联填色符合要求；image 显式使用 aspectFit。

## 验证结果

| 层级 | 结果 | 证据及边界 |
| --- | --- | --- |
| 静态 | passed | 完整矩阵 48 项已逐项复核，适用项满足；不适用项附原因。详见 [矩阵](../run-1/static-audit.md) 与 [静态证据](../run-1/static-audit.json)。 |
| ESLint | passed | 使用工作区现有配置检查完整业务 SFC，退出码 0；[日志](../run-1/eslint.log) 为空。 |
| Jest / mock | passed | 14/14 通过：[测试](../run-1/user-list.test.cjs)、[结果](../run-1/jest-results.json)、[日志](../run-1/jest.log)。覆盖初始化、null/数组更新、过滤后行数据、查询目标和回顶参数、按下/松开/取消、详情入口契约。 |
| wx 真实编译 | passed | Mpx/webpack 单组件真实编译，0 errors / 0 warnings：[原始日志](../run-1/compile.log)、[编译结果](../run-1/compile-result.json)。 |
| 微信开发者工具 WebView / Skyline | not_run | 未接入业务宿主和开发者工具。 |
| 真机 WebView / Skyline | not_run | 无真机环境。长 label 视觉截断、动画插值、实际滚动及页面路由均待验。 |

Jest 使用 VM 截获组件定义并手动求值 computed，模拟查询上下文和导航 API；行片段仅模拟字段替换。分别传入两种 renderer 名称运行共用逻辑，不代表执行了 Mpx 响应式、微信模板引擎或真实双 renderer。简单 navigator 的跳转仅核验 URL/结构，实际路由未运行。

测试共运行 3 次、修复 2 次：第一次 Watchman 无权访问宿主状态目录，在 run-1 的 Jest 配置禁用 Watchman；第二次测试正则未转义 `{{1}}`，修正测试表达式后通过。业务文件未因这些测试问题修改。失败日志及结果均保留在 run-1。

检查范围包含组件、外部 WXML 和 SVG；无其他业务依赖或子组件。app.json、宿主页/构建配置、调用侧 props 与详情页未提供，未核验；按单组件检查范围说明配置规则例外。没有未说明的 error/warn 残留。真实编译成功不代表布局、动画、滚动或宿主路由通过。

## 复现与待验

所有命令固定在用户指定工作目录执行：

```sh
npm run compile-validate -- iteration-7/eval-2-template-runtime-inline-animation/mpx/outputs/user-list.mpx --target=wx --json
node node_modules/eslint/bin/eslint.js iteration-7/eval-2-template-runtime-inline-animation/mpx/outputs/user-list.mpx
node -e 'require("jest").run(["--config", "iteration-7/eval-2-template-runtime-inline-animation/mpx/run-1/jest.config.cjs", "--runInBand"])'
python3 iteration-7/eval-2-template-runtime-inline-animation/mpx/run-1/static-audit.py
```

接入原业务宿主后，在 WebView 和 Skyline 各验证一次：初始/null 为空、过滤行号连续；窄宽度下图标与超长 label 同段单行省略且圆点固定 8px；观察圆点 1 秒循环；按住、松开、取消确认按钮恢复和 150ms 过渡；向下滚动用户列表后多次回顶且 other 不受影响；两个详情入口均实际进入 `/pages/detail`。

机器可读汇总：[validation.json](../run-1/validation.json)。仅使用指定 Mpx Skill 及其按需参考；未读取其他专项 Skill、评分契约或历史产物，未修改输入与环境配置。
