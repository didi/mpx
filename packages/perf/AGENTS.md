# @mpxjs/perf

Mpx2RN 运行时按需测速探针。采用「编译期常量开关 + 运行时探针实现 + tree-shaking 兜底」三层结构，关闭态下产物中**不含**任何探针代码、字符串字面量、模块依赖。设计与背景见 [solutions/rn-runtime-perf-probe.md](../../solutions/rn-runtime-perf-probe.md)。

## 入口文件

- [src/index.ts](src/index.ts)：顶层三元分流（`__mpx_perf__ ? impl.x : noop.x`），对外导出 `scopeStart` / `scopeEnd` / `mark` / `measure` / `start` / `end` / `setReporter` / `clearReporter` / `createConsoleReporter` / `consoleReporter`，及类型 `Reporter` / `AggResult`。
- [src/global.d.ts](src/global.d.ts)：声明 `__mpx_perf__` 全局常量，由使用方 webpack 的 DefinePlugin 注入。
- `package.json` 的 `main` 指向 `dist/index.js`；接入侧需以**未压缩、未编译**源码形式被引用，让最终构建链 Terser 完成 DCE。

## 核心模块

- [src/impl.ts](src/impl.ts)：录制态实现。
  - 内部 `now()` 优先 `performance.now`，回退 Hermes `globalThis.nativePerformanceNow`，再兜底 `Date.now`。
  - `scopeStart` / `scopeEnd` 用平行数组 `stackName` / `stackStart` + `freeList` 复用 id 槽位，**零对象 / 零闭包分配**，未录制态直接返回 `-1`。
  - `mark` / `measure` 用 `Map<string, number>` 暂存时间戳，`measure` 命中后立即 `delete`，跨作用域起止配对使用。
- [src/bus.ts](src/bus.ts)：录制状态机与实时聚合容器。
  - 维护 `_recording` 标志、`aggMap: Map<name, AggResult>` 与全局 `_reporter`（默认 `consoleReporter`）。
  - `start()` 重建新 `Map`（而非 clear），保证 reporter 拿到的引用是该窗口私有数据；重复 start 幂等。
  - `pushMeasure` 阶段只做 `Map.get` + 累加（首样本一次 `Map.set` 分配 `AggResult`），不算除法；`end()` 时一次性回填 `avg = sum / count`，吞 reporter 抛错。
- [src/noop.ts](src/noop.ts)：关闭态空实现。`scopeStart` 恒返回 `-1`，其他 API 为空函数；通过顶层三元让 Terser 把 `impl` / `bus` / `reporters` 整支 DCE。
- [src/types.ts](src/types.ts)：对外类型 `AggResult`（`count` / `sum` / `avg` / `max`）与 `Reporter = (agg: Map<string, AggResult>) => void`。
- [src/reporters/console.ts](src/reporters/console.ts)：内置 console reporter。
  - `createConsoleReporter(options?)` 工厂支持 `sortBy` / `filter` / `header`；输出走对齐字符串 + 单条 `console.log`，刻意规避 `console.table` 在 RN / Hermes inspector 上的渲染差异。
  - `consoleReporter` 是默认参数实例，bus 未被 `setReporter` 替换时使用它。

## 典型调用链

1. **业务接入**：`mpx.config.js` 中开启 `pluginOptions.mpx.plugin.perf.enable` → webpack-plugin 通过 DefinePlugin 注入 `__mpx_perf__` 与分组开关（如 `__mpx_perf_framework__` / `__mpx_perf_user__`）→ 引用 `@mpxjs/perf` 的源码被使用方 Terser 静态折叠。
2. **录制窗口**：业务 `start()` → [bus.ts](src/bus.ts) 置 `_recording = true` 并新建 `aggMap` → 调用方在 `if (__mpx_perf_framework__)` / `if (__mpx_perf_user__)` 字面量门禁下用 `scopeStart` / `scopeEnd` 或 `mark` / `measure` 上报 → `bus.pushMeasure` 实时聚合 → `end(reporter?)` 回填 `avg` 并同步触发全局 + 局部 reporter。
3. **关闭态零残留**：`__mpx_perf__: false` 时顶层 `false ? impl.x : noop.x` → `noop.x`；`impl.ts` 引用的 `bus.ts` / `reporters/*.ts` 级联失活，被 webpack `usedExports` 标记后整段 tree-shake，`noop.ts` 空函数本身也被调用点 inline 消除。

## 注意

- 源码语言是 TypeScript（仓库唯一），`tsc -p` 产物落 `dist/`；新增能力维持 `src/` 文件粒度小、`index.ts` 仅顶层三元分流的形态，便于 DCE。
- 调用方约束：必须保留默认 Terser 配置（不关 minimizer、不禁用 `dead_code` / `conditionals`），`babel-preset-env` 不要把顶层三元变换成 `if/else` 平铺，否则 DCE 失效。
- 业务自定义探针推荐 `let id = -1` + `scopeStart` / `scopeEnd` 句柄形式，配合 `if (__mpx_perf_user__)` 字面量门禁；不要把分组开关下沉到本包内部——`@mpxjs/perf` **不感知分组**。
- Reporter 拿到的 `Map<name, AggResult>` 是 bus 内部引用，回调内不要直接修改；如需异步持有请自行复制。
