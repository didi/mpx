# @mpxjs/webpack-plugin

Mpx 的 webpack 构建插件。它不是独立编译器，而是**深度嵌入 webpack 编译流程**的一组扩展：插件类（[MpxWebpackPlugin](lib/index.js)）+ 一系列 loader（业务 rules 中通过静态工厂引入）+ 自定义 Dependency / Resolver Plugin / 子编译器，挂到 webpack 各 hook 上，把 `.mpx` 单文件拆解、编译、按目标平台（各类小程序 / Web / React Native）重新组装为可运行产物。

## 入口

业务侧通过 [lib/index.js](lib/index.js) 顶层导出的 `MpxWebpackPlugin` 接入，类上的静态工厂用于 `webpack.config.js`：

- `MpxWebpackPlugin.loader(opts)` → [lib/loader.js](lib/loader.js)，绑定到 `/\.mpx$/`（Web 模式下置于 vue-loader 之后）
- `MpxWebpackPlugin.nativeLoader(opts)` → [lib/native-loader.js](lib/native-loader.js)，原生 4 区块组件
- `MpxWebpackPlugin.wxmlLoader(opts)` / `wxssLoader(opts)` → 独立 wxml/wxss 类资源（含跨方言后缀）
- `MpxWebpackPlugin.wxsPreLoader(opts)` → wxs/qs/sjs/... 的 `enforce: 'pre'`
- `MpxWebpackPlugin.urlLoader(opts)` / `fileLoader(opts)` → 静态资源
- `MpxWebpackPlugin.pluginLoader(opts)` → 小程序插件工程入口
- 入口辅助：`getPageEntry / getComponentEntry / getNativeEntry / getPluginEntry`

包内三个核心入口：

- [lib/parser.js](lib/parser.js)：把 `.mpx`/`.vue` 拆为 `template/script/styles[]/json/wxs[]`，缓存按 `mode/env/path/content` 隔离
- [lib/config.js](lib/config.js)：跨端配置事实表（`typeExtMap`、模板/事件/wxs/组件差异），所有目标平台差异先来这里查
- [lib/helpers.js](lib/helpers.js)：`getRequire(type, part, extra, idx)` 把各 block 编排成 `<fakeRequest>!=!<selector>?...!<rawRequest>?mpx&type=...` 的内联 loader 链 request

## 核心模块

- [lib/loader.js](lib/loader.js) / [lib/selector.js](lib/selector.js) / [lib/extractor.js](lib/extractor.js)：主流程三件套——拆分调度 / block 选取 / 抽取为独立资产
- [lib/template-compiler/](lib/template-compiler/)：wxml AST 解析、跨端方言转换、render 函数生成（含 RN/JSX）、动态运行时模板
- [lib/style-compiler/](lib/style-compiler/)：基于 postcss 的 rpx/scoped/跨端单位/条件编译注释剥离
- [lib/json-compiler/](lib/json-compiler/)：app.json / page / component / theme / 小程序插件工程；**动态加 entry 的源头**
- [lib/wxs/](lib/wxs/)：wxs 模块化 + 模板引用（含独立的 webpack 子插件）
- [lib/wxml/](lib/wxml/) / [lib/wxss/](lib/wxss/)：独立 wxml / wxss 处理 + 产物侧 wxss 运行时
- [lib/script-setup-compiler/](lib/script-setup-compiler/)：`<script setup>` 支持
- [lib/web/](lib/web/) / [lib/react/](lib/react/)：mode 分别为 `web` / `ios|android|harmony` 时由 [loader.js](lib/loader.js) 调用，把 mpx 改写为 vue-loader 期望的 SFC / RN 用 JS 模块
- [lib/dependencies/](lib/dependencies/)：自定义 webpack Dependency，通过 `compiler.hooks.compilation` 注册。命名前缀对应职责：`*EntryDependency`（入口/分包）、`Record*Dependency`（资源/模块映射）、`Inject/Replace/ResolveDependency`（代码改写）、`CommonJs*Dependency`（require 协议扩展）
- [lib/resolver/](lib/resolver/)：自定义 enhanced-resolve 插件，按 mode/env 给请求加中缀、按 npm 包类型路由入口、按规则切到运行时渲染
- [lib/runtime/](lib/runtime/) / [lib/runtime-render/](lib/runtime-render/)：编译期被 require、产物里执行的运行时辅助；动态运行时渲染产物
- [lib/platform/](lib/platform/)：跨端转换规则表，由 `getRulesRunner({ type, mode, srcMode })` 在编译期消费，新增方言差异先看能否表达为规则
- [lib/utils/](lib/utils/)：构建期工具集，重点：`normalize`（loader 路径必经）、`parse-request` / `add-query`（request 操控）、`match-condition`（统一 include/exclude）、`set`（懒求值集合）、`env`（mode 判定）、`const`（关键字符串常量）

`compilation.__mpx__` 是上述模块共享的状态总线（loader 内 `this.getMpx()` 获取），承载 `pagesMap` / `componentsMap[packageName]` / `subpackagesEntriesMap` / `addEntry` / `getOutputPath` / `getExtractedFile` / `getPackageInfo` 等。详见 [lib/index.js](lib/index.js) 的 `compilation.__mpx__ =` 初始化块和 [lib/global.d.ts](lib/global.d.ts) 类型。

## 典型调用链

**A. `.mpx` → 平台产物**：webpack 命中 `.mpx` → [loader.js](lib/loader.js) 用 [parser.js](lib/parser.js) 拆 block，判定 `ctorType`，挂上 `Record*Dependency` → [helpers.js](lib/helpers.js) 为每个 block 生成子 request → webpack 在 `afterResolve` 阶段往子 request 链上 splice 进 [extractor.js](lib/extractor.js) 与对应 type 的子编译器（template/style/json/wxs）→ [extractor.js](lib/extractor.js) 在 pitch 阶段 `importModule` 取产物，写入 `module.buildInfo.assetsInfo.<file>.extractedInfo` → `compilation.hooks.beforeModuleAssets` 拼接所有 extractedInfo 并 `emitAsset` 输出最终 wxml/wxss/json，`processAssets` 阶段对 JS chunk 做小程序所需的包装。

**B. JSON 中 `pages/usingComponents` → 新 entry**：[json-compiler/](lib/json-compiler/) 解析 JSON，遍历 pages/subpackages/usingComponents/tabBar/workers，借 `DynamicEntryDependency` 推入 `mpx.subpackagesEntriesMap`，并通过 `RecordResourceMapDependency` 把"资源 → 输出路径"登记进 `mpx.pagesMap` / `mpx.componentsMap[packageName]`；`compiler.hooks.finishMake`（stage `-1000`）串行执行队列 `addEntry`，新发现的入口入队迭代直至清空。

**C. 跨端到 Web**：mode=`web` → [loader.js](lib/loader.js) 调 [web/index.js](lib/web/index.js) → 内部 `processTemplate/Script/Styles/JSON` 把 mpx 改写为 vue-loader 可消化的 SFC，业务方需自备 `vue-loader` + `MiniCssExtractPlugin` + `VueLoaderPlugin`；`processAssets` 阶段不做小程序 chunk 包装，splitChunks 改用 `main`(`/node_modules/`) + `async` 两组。

**D. 跨端到 React Native**：mode ∈ `ios|android|harmony` → [loader.js](lib/loader.js) 调 [react/index.js](lib/react/index.js) → 同名 `process*.js` 输出 RN 用 JS 模块；异步分包通过 `AsyncDependenciesBlock + ImportDependency` 实现，`runtimeRequirementInTree` 注入 [RetryRuntimeModule](lib/dependencies/RetryRuntimeModule.js)；chunk 在 `processAssets` 阶段被注入 `@refresh reset`、`__mpxPageConfigsMap` 与异步 chunk 缓存清理。
