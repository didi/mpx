# 适配报告

交付完整 user-list.mpx、row.wxml；输入未修改。范围仅组件及其外部片段，宿主页面已接入 Skyline/glass-easel，未扩展页面或全局配置。

- items 初值为空数组，initData.visibleItems 提供 computed 初始化前空值，setRows 将 null 归一为空数组；正常数组按 visible 筛选，行号保留筛选后的零基 index。
- 循环子树 include 改 import + 具名 template，显式传入 item/index。
- 实际列表 id 改为 users，并开启 enhanced；回到顶部通过 this.createSelectorQuery() 获取该列表上下文。
- 两个详情入口保持 /pages/detail，卡片入口子节点改 text，满足 navigator 结构限制。
- 保留 payload 合法联合类型、data.config.default 业务字段、other 容器和原有 300px 高度。

采用 WebView/Skyline 通用方案，无新增 Skyline-only API。行号、筛选及导航地址保持原意。其他目标平台未验证。

验证：Jest 3/3 通过；Mpx 微信模板解析覆盖主模板和外部片段，无错误；ESLint 0 errors / 0 warnings。完整矩阵已逐条复核，记录在 ../run-1/audit.md，无未说明 error/warn 残留。

设备与运行环境验证：Skyline 真机渲染、WebView 真机回归、实际滚动及详情跳转均 not_run；当前结果包含脚本执行、模拟 ScrollViewContext 与模板解析，不替代设备验收。
