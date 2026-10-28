# 用户列表 Skyline 适配报告

已交付完整的 `user-list.mpx`、`row.wxml`、`logo.svg`。范围仅该组件、外部行片段及图标，适用于微信 WebView / Skyline；按任务前提复用宿主已有 Skyline/glass-easel 接入。

## 适配结果

- 标题使用同段 `span` 包含图标与 `label`，可收缩宽度配合 `max-lines=1`、`overflow=ellipsis`。WebView 保留原单行省略 CSS；Skyline 通过 `renderer` 动态类为实际图片设置 `inline-block`。图标显式使用 `aspectFit`，原 SVG 保留数值尺寸和内联颜色。
- 提示圆点置于标题旁，真实节点保持 8px、`#f50`，以原 1 秒周期在透明度 0.3 至 1 间循环；填充模式改为 `both`。
- 保留选项式组件和 `label`、`payload` 接口，保留 `config.default: 'keep'`。`initData.visibleItems=[]` 保护计算属性就绪前的渲染，`items` 默认空数组，`setRows({items:null})` 归一为空数组。仅过滤 `visible` 用户，外部具名模板接收过滤后的 `index` 和 `item`，行号沿用原零起点。
- `include` 改为 `import` + 具名 `template`，用户列表的循环行仍是 `scroll-view` 直接子节点。
- 实际列表 id 改为合法的 `users` 并开启 `enhanced`。组件内 `this.createSelectorQuery().select('#users').node()` 获取对应滚动上下文，点击同一个回顶按钮调用 `scrollTo({top:0})`；保留 `other` 对照容器。
- 按钮以动态类和双端 CSS transition 实现：按下缩放 0.96、透明度 0.7；松开或取消恢复 1；两项过渡均为 150ms。移除动画 API 依赖。
- 简单详情入口保留仅包含 `text` 的 `navigator`；卡片详情改为外层 `view` 点击调用 `wx.navigateTo`，均指向 `/pages/detail`。

## 验证结果

| 层级 | 状态 | 证据与边界 |
| --- | --- | --- |
| 静态 / ESLint | pass | `../run-1/eslint.json`：0 error、0 warning。 |
| 完整矩阵审计 | pass | `../run-1/audit.json`、`audit-scan.log`：48 条规则逐项复核，无未解释的 error/warn；候选命中已说明适用条件或例外。 |
| Jest / mock | pass | `../run-1/user-list.test.cjs`、`jest.json`、`jest.log`：11/11 通过；WebView/Skyline 参数分别检查初始化/null/数组更新、过滤后行号、目标列表回顶、两个入口、长短 label 结构与绑定、按下/松开/取消，并检查资源及动画声明。mock 执行真实业务脚本，但不运行 Mpx 响应式渲染器或微信原生组件。 |
| 真实 wx 编译 | pass | `../run-1/compile.log`：指定共享工具、组件入口、不忽略依赖；0 error、0 warning。仅证明 Mpx 微信目标编译成功。 |
| 开发者工具渲染 | not_run | 未启动微信开发者工具。 |
| 真机 / 实际滚动与跳转 | not_run | 未验证两端长标题共同截断、图片对齐、动画观感、触摸取消、真实滚动及页面栈跳转；静态或 mock 结果不替代真机结论。 |

Jest 初次受 Watchman 状态目录权限限制，关闭测试进程的 Watchman 后重跑；随后修正 mock 对 WXML `data="{{index,item}}"` 对象简写的解析。共修复 2 次，第 3 次运行全通过，历史失败证据保留在 `jest-attempt-1.log`、`jest-attempt-2.log/json`。无需改动业务产物或环境配置。

页面与 app 配置属于已确认的组件范围之外，`CONFIG_APP_SKYLINE_OPTIONS` / `CONFIG_PAGE_SKYLINE` 按组件例外处理；没有 Worklet。已核对快照对 `rendererOptions.skyline.keyframeStyleIsolation: 'legacy'` 的建议，但宿主文件未提供，实际配置值及基础库环境未核验。外部宿主调用方的实际属性传值不在本次输入范围。

复现命令、分层状态及证据索引见 `../run-1/validation.json`。所有 shell 命令均从指定 workspace 根目录执行，仅写入本组 `outputs/` 和 `run-1/`。
