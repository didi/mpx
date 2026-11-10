# @mpxjs/size-report

Mpx 构建产物的体积分析工具：在 webpack 编译完成后扫描所有产物，按分包/模块/资源分类统计体积，可生成 JSON 报告并启动可视化服务器。

## 入口文件

- [src/index.js](src/index.js)：CommonJS 入口，转发 [SizeReportPlugin.js](src/SizeReportPlugin.js)。
- [src/SizeReportPlugin.js](src/SizeReportPlugin.js)：webpack 插件主体（`SizeReportPlugin` 类）。

## 核心模块

- [src/SizeReportPlugin.js](src/SizeReportPlugin.js)：
  - 构造函数合并 `options.server`（host/port/autoOpenBrowser/enable）。
  - `apply(compiler)`：在 webpack `emit` / `done` 阶段读取 `compilation` → 解析 chunk/asset → 关联回模块、分包 → 写入报告文件，必要时调用 [server.js](src/server.js) 启动 web 服务。
- [src/utils/parse-asset.js](src/utils/parse-asset.js)：把 webpack asset 拆解到模块/资源粒度（处理 source-map、bundle 内联模块等）。
- [src/server.js](src/server.js)：本地可视化服务器，渲染 [views/](views/) 模板并读取报告 JSON。
- [views/](views/) / [public/](public/)：可视化前端资源（HTML/CSS/JS）。

## 典型调用链

1. **集成**：`new SizeReportPlugin({ reportPath, server: { autoOpenBrowser: true } })` → 加进 webpack `plugins`（与 `MpxWebpackPlugin` 协同）。
2. **采集**：webpack `done` → 遍历 `compilation.assets`、`compilation.chunkGroups` → 通过 [parse-asset.js](src/utils/parse-asset.js) 关联回模块；借助 `@mpxjs/webpack-plugin` 的 utils（`match-condition`、`parse-request`、`to-posix`、set helpers）做路径与集合处理。
3. **输出**：把报告写入 `outputFileSystem`（兼容 mfs/真实 fs）；若 `server.enable`，启动 [server.js](src/server.js)，浏览器加载 [views/](views/) 渲染。

## 注意

- 跨平台（小程序分包 / Web bundle）形态差异大，新增统计维度时优先复用现有 set 工具（`every`/`has`/`map`/`filter`/`concat`/`mapToArr`），保持懒求值。
- 文件写入统一走 webpack 的 `outputFileSystem`，方便在 mfs 场景（HMR / 单测）正常工作。
