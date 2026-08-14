# Mpx 小程序输出 Web 差异 Benchmark

本 benchmark 的输入全部是现有小程序/Mpx 业务代码，目标是在不破坏小程序行为的前提下补齐 Web 输出。`no_skill` 与 `has_skill` 使用相同输入和任务，唯一变量是能否读取 `mpx2web` Skill。

除目标 WebView 小字号这一环境特例需要提供实测现象外，其余题目只要求把现有小程序代码适配到 Web，不提示具体故障、修复 API、语法或 CSS 方案；解决路径必须由执行模型从输入源码自行诊断。

## 用例

1. 目标 WebView 实测存在的 `<12px` 字号放大与 Web-only 缩放补偿。
2. 父页面与子组件同名样式的真实污染：小程序 `styleIsolation` 与 Web `scoped`、基础标签转换差异。
3. WXS 高频滑动在 Web 的事件入口、`touchcancel`、多实例状态和滑后误触处理。
4. Web 缺失的 `chooseLocation`、`openLocation`、`chooseMedia`：运行容器与 Bridge 未确定时只隔离并预留业务 TODO。
5. Web 使用 `SocketTask`，并处理重连时旧任务晚到回调与卸载竞态。
6. 保留小程序分享并通过 `implement(remove: true)` 移除 Web 分享生命周期；Web 业务分享仅预留 TODO 接入位，不擅自选择 SDK 或降级方案。
7. 商品详情小程序页面转 Web SSR：并发请求隔离、按商品身份复用注水、服务端请求地址、异步分包与路由配置。

每组输出保持源文件类型，写入对应 `outputs/`，不接受 Markdown 答案。
