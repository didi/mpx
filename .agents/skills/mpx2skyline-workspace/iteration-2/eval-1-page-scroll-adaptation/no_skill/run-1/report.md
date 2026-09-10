# 订单页面双渲染适配

完整产物位于 `outputs/`：`orders.mpx`、`app.json`、`service.js`。依赖保持同级相对导入；输入文件未修改。

- 将滚动容器设为满页高度的 `scroll-view`，使用 `bindscroll` 的 `detail.scrollTop` 展示滚动位置。
- 首次加载仍由 `onLoad` 发起；下拉刷新由 `bindrefresherrefresh` 发起；分页追加由 `bindscrolltolower` 发起，两种渲染器共用实现。关闭页面滚动和页面原生刷新，避免两个滚动/刷新来源冲突。
- 通过 `refresher-triggered` 绑定刷新状态，并在请求 `finally` 中复位，失败保留已有数据及页码；请求锁防止重复触底和刷新并发覆盖数据。
- 页面声明 Skyline 渲染，应用启用 glass-easel，并配置 Skyline SDK 范围及布局默认值；不符合 Skyline 生效条件时使用微信的 WebView 回退。手动验证 WebView 可将页面 `renderer` 切为 `webview`，页面模板和业务代码不变。
- 保留导航标题“订单”、原有 `pages`、`window`、`rendererOptions.webview`；`service.js` 原样复制，未新增请求服务。

## 实际验证

运行 `node verify.cjs`，退出码 0。验证 JSON 可解析、原配置及服务保留、相对导入与事件绑定；通过 Node VM 提取脚本并模拟请求，验证首载、分页追加、滚动位置、刷新成功/失败、分页失败、重复请求保护。

未运行 Mpx 构建、ESLint、Jest、微信开发者工具或真机测试：输入不含工程清单、构建配置或测试依赖，且本次仅访问指定运行目录。Node 检查不代表微信渲染验证。仍需在实际工程中验证 Skyline 和 WebView 的容器高度、刷新指示器、触底事件以及 SDK 回退。
