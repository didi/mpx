# 适配结果

交付 `user-list.mpx` 与其引用的完整外部片段 `row.wxml`。宿主页已接入 Skyline/glass-easel，本次不修改宿主配置。

- 列表初始值为 `[]`；`setRows({ items: null })` 归一为空数组，计算属性始终返回数组，仅保留 `visible` 用户。
- 循环显式声明 `user`、`rowIndex`，外部片段使用同名变量展示过滤后从 0 开始的行号与姓名，保留原有零基行号语义。
- 实际用户列表 ID 改为 `users`，开启 `enhanced`，回顶仍通过组件作用域下的精确 ID 获取该列表节点并调用 `scrollTo({ top: 0 })`；保留旁边的 `other` 列表。
- 两个详情入口改为 `view` 点击事件，共用 `wx.navigateTo({ url: '/pages/detail' })`；所有展示文字放在 `text` 内。
- `payload` 改为 `type: null`，保留空字符串默认值并允许原有字符串与对象输入。该声明也会接受其他类型；输入约定仍为字符串或对象。
- 保留组件 JSON、配置数据和列表高度；相关节点、导航与数据处理也适用于微信 WebView。

# 验证

- PASS：Jest 1 个套件、4 个测试，覆盖初始/null/过滤数据、精确列表回顶调用、两个详情事件入口和导航目标、循环片段变量及 JSON 解析。
- PASS：抽取组件业务脚本执行 ESLint（`no-unused-vars`、`no-undef`），退出码 0。
- not_run：完整 Mpx 编译、微信开发者工具、Skyline/glass-easel 真机与 WebView 真机。当前证据为脚本隔离测试及静态检查，不证明原生片段展开、点击和滚动已经在实际渲染器执行成功。需宿主项目验证外部 include 的循环变量渲染、两个详情跳转及用户列表回顶，尤其检查 other 列表不受影响。

测试与原始日志保存在相邻 `run-1/`，未读取 Skill、参考资料或评分定义。
