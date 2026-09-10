# user-list 双渲染适配

已交付 `user-list.mpx` 与依赖模板 `row.wxml`，相对引用路径保持不变。

- `label` 默认值改为 `value`；`payload` 使用 `String` 主类型与 `optionalTypes: [Object]`，继续支持两种调用参数。
- `initData.visibleItems` 提供首次渲染空数组，computed 在 undefined/null 时也返回空数组，保留可见项过滤、顺序与过滤后的 index；`setRows` 原样保存接口 items。
- 循环内 include 改为 import + 命名 template，显式传入 item/index；依赖模板保留原文本内容。
- 回顶目标改为合法 id `users`，同步实例内查询，给目标容器补齐 `type="list"` 和 enhanced。保留按钮、另一滚动容器、原 300px 高度以及 `config.default: 'keep'`。

验证：4 项 Jest 核心测试全部通过；从最终 SFC 提取的业务脚本通过 Standard ESLint；完整 47 条 Skyline 矩阵逐项复核，证据在 `../run-1/audit.json` 与 `audit-scan.txt`。无未处理 error/warn；空的 other 容器不承载列表，保留其原行为。ESLint 首先两次因 CLI 选项名称无效退出，改用配置文件后通过，业务代码未因此修改。

覆盖范围为本组件与 row 模板。组件任务不新增页面或 app 配置，无自定义组件子树或其他依赖需要交付。本次未安装依赖；测试为逻辑与结构验证，未执行完整 Mpx 工程构建、微信开发者工具或真机双渲染验收。接入已有项目后需核验 glass-easel/Skyline 宿主配置，并在两种渲染模式确认列表展示与回顶实际效果。
