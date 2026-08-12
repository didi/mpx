# @mpxjs/perf

Mpx2RN 运行时按需性能探针，提供实时区段聚合、有界 trace 区段序列和有界 mark 点序列。采用「编译期常量开关 + 运行时探针实现 + tree-shaking 兜底」三层结构，关闭态产物不含探针实现、名称字符串或模块依赖。设计与背景见 [solutions/rn-runtime-perf-probe.md](../../solutions/rn-runtime-perf-probe.md)、[solutions/rn-runtime-perf-mark-timeline.md](../../solutions/rn-runtime-perf-mark-timeline.md) 和 [solutions/rn-runtime-perf-profile.md](../../solutions/rn-runtime-perf-profile.md)。

## 入口文件

- [src/index.ts](src/index.ts)：为每个 API 保留独立顶层三元分流（`__mpx_perf__ ? impl.x : noop.x`）。对外提供：
  - 聚类统计：`aggrStart` / `aggrEnd`。
  - 区段序列：`traceStart` / `traceEnd`。
  - 点序列：`mark`。
  - 兼容聚类 API：`scopeStart` / `scopeEnd` / `measureStart` / `measureEnd`。
  - 窗口与 Reporter：`start` / `end` / `setReporter` / `clearReporter` / `createConsoleReporter` / `consoleReporter`。
  - 类型：`AggrResult` / `MarkEvent` / `MarkTimeline` / `TraceEvent` / `TraceTimeline` / `PerfStartOptions` / `Reporter`。
- [src/global.d.ts](src/global.d.ts)：声明 `__mpx_perf__`，由使用方 webpack 的 DefinePlugin 注入。
- `package.json` 的 `main` 指向 `dist/index.js`；产物必须保留顶层三元，再由最终构建链完成 DCE。

## 核心模块

- [src/impl.ts](src/impl.ts)：录制态 API。
  - `now()` 优先 `performance.now`，回退 Hermes `globalThis.nativePerformanceNow`，最后使用 `Date.now`。
  - `aggrStart/aggrEnd` 的 id 模式使用 `aggrNames` / `aggrStarts` 平行数组和 free list，保持高频路径零对象、零闭包分配；name 模式用 `Map<string, number>` 配对。
  - `traceStart/traceEnd` 使用单调数字 id 或 name 映射到 bus 预留的事件位置。窗口结束清空映射，旧 id 不得污染下一窗口。
  - 四个旧聚类函数只是 `aggr*` 的薄包装，不维护第二套状态。
- [src/bus.ts](src/bus.ts)：录制状态机和三类窗口数据。
  - 聚合容器为 `aggrMap: Map<string, AggrResult>`，push 阶段累加，end 时回填 avg。
  - MarkTimeline 自动包含 start/end 边界；TraceTimeline 在 trace start 时占位、end 时回填，窗口结束原地压缩未完成事件并计算 `incomplete`。
  - mark 与 trace 容量独立，默认均为 1024，由 `start({ markLimit, traceLimit })` 覆盖。达到上限后只增加对应 `dropped`。
  - 全局与局部 Reporter 同步收到同一份 aggregates、marks、traces 引用。
- [src/noop.ts](src/noop.ts)：关闭态壳子。id 模式 start 返回 `-1`，其他 API noop；签名必须与 impl 对齐。
- [src/types.ts](src/types.ts)：所有公开类型。Reporter 签名为 `(aggregates, marks?, traces?) => void`。
- [src/reporters/console.ts](src/reporters/console.ts)：分别输出 aggregates、traces、marks 和 dropped/incomplete 提示。`sortBy` 只影响 aggregates；filter 同时作用于三类名称但保留 mark 边界；info 格式化失败不得影响业务。

## 典型调用链

1. 业务配置 `pluginOptions.mpx.plugin.perf.enable/probes`，webpack-plugin 注入 `__mpx_perf__` 与分组字面量。
2. `start(options?)` 创建新的聚合 Map、带边界的 MarkTimeline 和空 TraceTimeline。
3. 调用方在字面量门禁下使用 aggr 聚合高频耗时、trace 保存完整区段、mark 保存里程碑。
4. `end(reporter?)` 写入 mark end 边界、关闭录制、回填 avg、压缩未完成 trace，再触发全局和局部 Reporter。
5. 总开关关闭时，顶层三元选择 noop，impl / bus / console reporter 级联失活并由最终构建 tree-shake。

## 性能与兼容约束

- 所有新 API 继续使用独立顶层三元，禁止在 [src/index.ts](src/index.ts) 新建包装闭包。
- 聚类 id 热路径只能使用数组槽位和 free list；不要引入事件对象、闭包或通用计时器类。
- trace 必须在 start 时预留事件位置，确保 Reporter 顺序与 traceStart 顺序一致；不得改成 end 时 push 后再排序。
- mark 与 trace 超出容量后不得保存 name、时间或 info；不得使用 `shift` 或循环覆盖。
- `info` 只保存引用，不复制、不校验、不序列化。默认 Console Reporter 必须安全处理循环引用和异常 stringify。
- `scope*` / `measure*` 保持导出和原签名；新代码优先使用 `aggr*`。
- `AggrResult` 不保留旧 `AggResult` 类型别名；MarkEvent 使用 `start` / `timestamp`，不再使用 `at`。
- 调用方必须直接使用 `if (__mpx_perf_framework__)` / `if (__mpx_perf_user__)` 字面量门禁；本包不感知分组。
- 运行时代码禁止 Object spread；对象合并使用 `Object.assign` 或仓库内部工具。
