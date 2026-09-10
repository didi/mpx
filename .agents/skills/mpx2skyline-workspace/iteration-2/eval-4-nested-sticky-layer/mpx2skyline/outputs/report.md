# 分类面板 Skyline 适配

交付 `category-panel.mpx` 完整组件。保留 `sections: [{id,title,items:[{id,name}]}]`、400px 面板、120×80px 卡片，以及打开/关闭弹层的业务状态。

- 在 attached 中通过 `this.renderer === 'skyline'` 隔离分支。Skyline 使用外层 nested 协调滚动、内层 custom 承载分组；每组以 sticky-section 包裹，首子节点 sticky-header 显式白色背景。WebView 保留每组 CSS sticky。
- 组内横向 list 明确开启 enable-flex 与 row 布局，卡片禁止收缩；Skyline 内层滚动容器声明 associative-container。
- 弹层移到滚动区外，与 fixed 悬浮按钮同级。弹层改为全屏 fixed，层级 3 高于按钮 2；点击关闭仅更新 opened，不重建滚动分支。移除原 outer 的 transform 和无效层级依赖。
- 仅涉及本组件，无额外组件或资源依赖，未修改输入、宿主页面及 app 配置。

验证：提取的业务脚本 ESLint 通过；Jest 2 项通过，覆盖渲染分支选择、弹层开关状态、Mpx 微信模板解析、CSS 解析及 JSON。完整 Skyline 矩阵审计与扫描证据位于 run-1/audit.md、audit-scan.txt。静态 error 无未解释残留；CSS sticky 是 WebView 分支的预期保留。

未验证：当前没有微信开发者工具/真机环境，未进行完整小程序构建。nested + custom 组合、各组吸顶/推出、长横向列表滑动与纵向手势切换、全屏弹层遮挡按钮及关闭后滚动位置恢复，需要在 WebView/Skyline 两端实测。官方补充 scroll-view 文档请求两次超时，未取得额外能力证明；不能将静态解析通过视为上述运行行为已验证。

宿主接入仍须具备 Skyline/glass-easel 页面与 app 推荐配置；这些文件不在本次组件范围。验收时使用足以超过 400px 的分组数量及每组足以横向溢出的卡片数，分别滑动列表、检查标题背景与边界、开关弹层，确认按钮在弹层打开时被覆盖。
