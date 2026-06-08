# Mpx2RN 运行时按需测速探针方案

## 背景

Mpx 跨端输出 React Native 时，运行时核心组件（`mpx-view` / `mpx-text` / `mpx-scroll-view` 等）以及 `useTransformStyle` 等公共 hook 是高频热路径，在大列表、复杂样式、嵌套文本场景下经常成为性能瓶颈。当前缺少一套贴合 mpx 抽象的、可在框架内随处插桩的测速能力——已有的 Hermes Profiler / Flipper 只能看到 RN 原生层调用栈，难以定位到 `splitStyle`、`useTransformStyle`、`wrapChildren` 等 mpx 自身逻辑。

业务方目前的常见做法：

1. 临时在 `mpx-view.tsx` 等文件里加 `console.time` 调试，发完 PR 再删。
2. 自己在外层包一层 HOC 测耗时，但拿不到组件内部 hook 拆分耗时。
3. 用 `__DEV__` 守卫，但 `__DEV__` 只能区分开发 / 生产，**无法**支持「生产构建里也能临时打开测速、关掉就完全无残留」的诉求。

目标是设计一套「需要时打开、不需要时关闭、关闭态产物零字节残留、不需要业务侧改源码」的运行时测速探针机制，作为 mpx 框架内置能力。

## 目标

1. 测速探针在框架内可以**点缀式**接入任意 RN 运行时组件 / hook，新增点不超过 5 行模板化代码。
2. 由 `MpxWebpackPlugin` 配置统一控制，支持「框架探针」/「用户探针」两个独立分组开关，未来可扩展更多分组。
3. 关闭态下产物里**不含**任何探针代码、字符串字面量、模块依赖。
4. 打开态下提供统一的 mark / measure / scopeStart / scopeEnd API，由业务在运行时显式 `start()` / `end()` 录制窗口、自行 `setReporter` 注册上报通道（默认 console / 业务自定义函数）。
5. **打开态下探针本身对热路径的影响接近忽略不计**——高频渲染场景（一帧 1000+ 次 scope 调用）下不引发显著 GC 压力，测速本身不污染被测对象。
6. 不引入新的运行时依赖，不影响 React Hooks 调用顺序稳定性，不与现有 `__mpx_mode__` / `__mpx_env__` 等机制冲突。
7. Web、各小程序方言不受影响，仅 RN 模式参与。

## 非目标

1. 不替代 Hermes Profiler / Flipper / Perfetto 等系统级 profiling 工具，定位为「mpx 抽象层的 mark / measure 数据源」，与系统工具互补。
2. 不实现完整的 APM 采集体系（错误追踪、网络耗时、FPS 监控等），只覆盖运行时模块耗时探针；上报通道留扩展点。
3. 不为「线上动态打开 / 关闭」提供能力——线上开关意味着探针字节必须进入产物，与目标 3 矛盾。线上诊断需重新打一个开启探针的内测包。
4. **不保留逐条事件**——见 §3 的设计取舍。需要 p50 / p95 / 直方图等分位指标的场景在调用点自行采样，本方案不内置。

## 整体方案

采用「编译期常量开关 + 运行时探针实现 + tree-shaking 兜底」三层结构：

```
业务侧 webpack 配置                                业务侧 RN 入口
   └─ new MpxWebpackPlugin({                          ├─ if (__mpx_perf__) setReporter(reporter)
        perf: {                                       └─ if (__mpx_perf__) start() ... end()
          enable: true,                                       │
          probes: ['framework', 'user']                       ▼ ⑤ 运行时显式控制录制 + 上报
        }                                            bus._reporter / bus._recording
      })                                             bus.aggMap: Map<name, AggResult>（实时聚合）
        │
        ▼ ① 编译期注入 DefinePlugin 常量
   defs: {
     __mpx_perf__:           true | false,    // 总开关，由 enable + probes 派生
     __mpx_perf_framework__: true | false,    // 分组：probes.includes('framework')
     __mpx_perf_user__:      true | false     // 分组：probes.includes('user')
   }
        │
        ▼ ② 探针在调用方按对应常量条件包裹
   @mpxjs/perf   （scopeStart / scopeEnd / mark / measure / start / end / setReporter，
                   仅看 __mpx_perf__ 总开关分流 impl / noop）
        │
        ▼ ③ 在热路径组件 / hook 中点缀
   框架内：if (__mpx_perf_framework__) ...      mpx-view.tsx / mpx-text.tsx / __getStyle / ...
   业务内：if (__mpx_perf_user__) ...           业务自定义 hot path
        │
        ▼ ④ Terser DCE
   关闭态：if (false) {...} 整块剔除 + ./impl 模块被 tree-shake
   只开某一分组：其他分组探针整段消失
```

三层缺一不可：

- 仅有运行时 `if (globalFlag)` ⇒ 字节会留在生产产物，违反目标 3。
- 仅有 DefinePlugin ⇒ 探针实现仍会 import 进 bundle，业务方不可能为「关闭态」单独维护一份分支文件。
- DefinePlugin + tree-shake 友好的模块划分（impl 与 noop 分离）⇒ 才能做到关闭态零残留。

## 关键设计取舍

### 实时聚合 only，不保留逐条事件

录制窗口内 bus 维护 `Map<name, AggResult>`，每次 `pushMeasure(name, dur)` 直接累加 `count / sum / max`，`end()` 时一次性回填 `avg`。**不保留 `PerfEvent[]` 事件流**。

放弃事件流模型的原因：

| 模型 | 单次 scope 堆分配 | 一帧 1000+ scope 的 GC 压力 |
| --- | --- | --- |
| 事件流（旧） | 1 个 `{ type, name, dur, start, meta }` 对象 + 1 个 stop 闭包 | 2000+ 短命对象，触发 Hermes minor GC，测速本身污染被测对象 |
| 实时聚合（当前） | 0（仅首次出现新桶时分配一个 `AggResult`） | 桶数稳态后零分配，对热路径影响接近忽略不计 |

代价：失去逐条事件 → 失去 p50 / p95 / 直方图等分位指标的能力。业务侧需要分位时在调用点自行采样。这一取舍符合「测速本身不污染被测对象」的目标 5，优先级高于"统计形态完备"。

### scope 句柄化（scopeStart / scopeEnd）

`scopeStart(name)` 返回 `number` id，`scopeEnd(id)` 关闭。**不返回闭包**。

| 形态 | 录制态单次成本 | 未录制单次成本 |
| --- | --- | --- |
| 闭包（旧 `scope(name) → () => void`） | 1 个闭包 + 捕获 `name / s / meta` 的 Context 对象 | 1 个空闭包仍要分配 |
| 句柄（当前） | 状态判断 + freeList 取 id + 1 次 `now()` + 2 次数组下标写。**零对象** | 状态判断 → 返回 `-1`，不调 `now()`、不写数组 |

实现细节：`impl.ts` 内部用平行数组 `stackName / stackStart` 持有进行中的 scope，`freeList` 回收已结束的槽位。不依赖严格栈序（虽然 React render 实际就是栈式，freeList 池稳态后槽位数 = 最大并发深度，不再增长）。

调用方模板从

```ts
// 旧
let stop: (() => void) | undefined
if (__mpx_perf_framework__) stop = perf.scope(name)
// ...
if (__mpx_perf_framework__) stop!()
```

变为

```ts
// 当前
let id = -1
if (__mpx_perf_framework__) id = perf.scopeStart(name)
// ...
if (__mpx_perf_framework__) perf.scopeEnd(id)
```

`id` 是 number，`-1` 既是"未录制"标志也是"已 end"标志，`scopeEnd(-1)` 是安全 noop。

### 每次 start 新建 Map

`bus.start()` 不用 `aggMap.clear()`，而是 `aggMap = new Map()`。代价是窗口级别一次小分配（可忽略），收益是 reporter 收到的 Map 引用归调用方私有——业务侧异步消费旧窗口数据时不会被下一次 `start()` 覆盖。

## 详细设计

### 1. 配置入口

在 [packages/webpack-plugin/lib/index.js](packages/webpack-plugin/lib/index.js) 的 options 归一化阶段增加 `perf` 字段。**编译期只管开关、不管 reporter / 录制时机等运行时行为**——这些都由业务侧在 RN 入口处通过 `@mpxjs/perf` 的运行时 API 自行调用。

#### 1.1 开关结构

`perf` 由「**总开关 + 分组开关**」两层组成：

| 开关 | 语义 | 来源 |
| --- | --- | --- |
| `__mpx_perf__`（总开关） | `@mpxjs/perf` 包内部用：决定 impl 是否进入 bundle、bus 是否启用 | 由 webpack-plugin 派生：`perf.enable === true && perf.probes` 含至少一个已知分组 |
| `__mpx_perf_framework__`（分组） | 框架内部探针（mpx-view / mpx-text / `__getStyle` 等）的字面量条件 | `perf.probes.includes('framework')` |
| `__mpx_perf_user__`（分组） | 用户自定义探针的字面量条件 | `perf.probes.includes('user')` |
| `__mpx_perf_<xxx>__`（未来扩展） | 新分组（如 navigation / network） | `perf.probes.includes('<xxx>')`；扩 `PERF_GROUPS` 数组 + 同步加 `declare` |

设计意图：

1. **总开关让 `@mpxjs/perf` 包零感知分组**——包内只用 `__mpx_perf__ ? impl : noop` 一刀切；新增分组时**不需要修改 `@mpxjs/perf` 源码**，只需在 webpack-plugin 的归一化逻辑里把新分组纳入即可。
2. **分组开关让点缀点细粒度可调**——框架代码用 `if (__mpx_perf_framework__) ...`，业务代码用 `if (__mpx_perf_user__) ...`；只开 framework 时业务探针字节被 DCE，反之亦然。
3. **总开关与分组开关一致性由编译期保证**——业务方不能直接配置 `perf.__mpx_perf__`，避免出现「分组全关但总开关为 true」的悖论态。

各分组 API 共享、字面量条件独立——开关粒度独立、产物 DCE 独立，但共用同一根 bus / 聚合 Map / reporter（业务侧 reporter 可同时收到所有桶，按 name 前缀区分）。典型用法：

- 调试框架自身性能：`{ enable: true, probes: ['framework'] }`，避免业务噪声干扰 baseline。
- 调试业务页面：`{ enable: true, probes: ['user'] }`，专注定位业务函数耗时。
- 全量诊断：`{ enable: true, probes: ['framework', 'user'] }`，看完整调用链。

#### 1.2 配置形态

显式 `enable` 总开关 + `probes` 字符串数组列出要打开的分组：

```js
// webpack.config.js 业务侧用法
new MpxWebpackPlugin({
  mode: 'ios',
  perf: {
    enable: !!process.env.MPX_PERF,
    probes: ['framework', 'user']
  }
})
```

`enable` 与 `probes` 的关系：

- `enable: false` 或 `perf` 字段不传 → 总开关 + 所有分组都关。
- `enable: true && probes: []` 等价于 `enable: false`（没有分组要开就视为关闭）。
- `enable: true && probes: ['framework']` → 总开关 + framework 分组开，user 分组关。
- `enable: true && probes: ['framework', 'user']` → 总开关 + 两个分组都开。
- `probes` 中出现未知分组名 → 编译期报错（避免 typo 静默失效）。

归一化逻辑：见 [packages/webpack-plugin/lib/utils/normalize-perf-options.js](packages/webpack-plugin/lib/utils/normalize-perf-options.js)。

**默认 reporter 即 `consoleReporter`**——业务方什么都不调，开启探针并 `start() / end()` 后 console 就有聚合表，零接入门槛。如果想换成自定义 reporter 把数据上报到 APM，再 `setReporter(myReporter)`；想完全静默调 `clearReporter()`；只想在某一次窗口结束时额外上报，传 `end(localReporter)`，它与全局 reporter 不互斥：

```ts
// 想自定义上报通道才需要这段；否则什么都不写也能看到 console 表
import { setReporter, end } from '@mpxjs/perf'
import type { AggResult } from '@mpxjs/perf'
if (__mpx_perf__) setReporter((agg: Map<string, AggResult>) => MyAPM.report(agg))

// 一次性追加上报，不替换上面的全局 reporter
if (__mpx_perf__) end((agg) => MyAPM.report('submit_perf', agg))
```

> **为什么编译期不管 reporter？**
> 1. webpack DefinePlugin 只能注入字面量，无法把业务侧的 reporter 函数对象跨编译期序列化进 bundle。
> 2. reporter 注册时机往往与业务自身 APM SDK 的初始化耦合（要等 user/device id、等本地存储就绪），编译期一刀切注入容易在运行时拿不到 SDK。
> 3. 拆开后职责更清晰——webpack-plugin 只负责「探针字节是否进入产物」，运行时由业务全权决定「何时开录、何时停录、聚合结果流向哪儿」。
> 4. 关闭态零残留更干净：`__mpx_perf__: false` 时所有 `if (__mpx_perf__) setReporter(...)` 整段被 DCE，业务自定义 reporter 函数及其闭包字节也一并消失。

### 2. 编译期常量注入

复用现有 DefinePlugin 体系（[packages/webpack-plugin/lib/index.js](packages/webpack-plugin/lib/index.js)），追加 1 个总开关 + N 个分组开关常量。归一化结果展开到 defs：

```js
const perf = normalizePerfOptions(options.perf)
options.defs = Object.assign({}, options.defs, {
  __mpx_mode__: options.mode,
  __mpx_src_mode__: options.srcMode,
  __mpx_env__: options.env,
  __mpx_dynamic_runtime__: options.dynamicRuntime,
  // 总开关（@mpxjs/perf 包内部使用）
  __mpx_perf__: perf.enable,
  // 分组开关（调用方点缀代码使用）—— 由 PERF_GROUPS 循环动态生成
  ...Object.fromEntries(
    PERF_GROUPS.map(k => [`__mpx_perf_${k}__`, perf[k]])
  )
})
```

同步在 [packages/webpack-plugin/lib/global.d.ts](packages/webpack-plugin/lib/global.d.ts) 中追加：

```ts
declare const __mpx_perf__:           boolean   // 总开关，@mpxjs/perf 内部使用
declare const __mpx_perf_framework__: boolean   // 分组：框架探针
declare const __mpx_perf_user__:      boolean   // 分组：用户探针
// 未来分组同步追加
```

源码侧约定（**强制**）：

| 角色 | 用什么常量 | 不允许用 |
| --- | --- | --- |
| `@mpxjs/perf` 包内部 | `__mpx_perf__` 总开关 | 任何分组开关——包不感知分组 |
| 框架运行时（`mpx-view.tsx` / `__getStyle` 等） | `__mpx_perf_framework__` 分组开关 | 总开关 / 其他分组开关 |
| 业务侧自定义探针 | `__mpx_perf_user__` 分组开关 | 总开关 / 其他分组开关 |
| `setReporter` 注册等"任一探针打开就生效"的运行时副作用 | `__mpx_perf__` 总开关 | —— |

每个常量各自独立做 DCE，互不影响：

- `__mpx_perf__: false` → `@mpxjs/perf` 整套 impl 被 tree-shake，bus / reporter 模块零残留。
- `__mpx_perf_framework__: false` 但 `__mpx_perf__: true` → 框架探针字面量被 DCE，但 `@mpxjs/perf` 仍进 bundle 服务其他分组。
- 反之亦然。

### 3. 运行时探针模块

探针 API 既被框架运行时引用，也允许业务侧在自有 RN 代码中复用同一套 API 接入到统一 reporter，因此**作为独立 npm 包发布**，与 `@mpxjs/utils`、`@mpxjs/fetch` 同级：

```
packages/perf/
├── package.json          # "name": "@mpxjs/perf", "sideEffects": false
├── README.md
├── tsconfig.json
└── src/
    ├── index.ts          # 公开 API；按 __mpx_perf__ 分流到 impl 或 noop
    ├── impl.ts           # 真正实现（scopeStart / scopeEnd / mark / measure / start / end / setReporter）
    ├── noop.ts           # 全部空函数 / scopeStart 恒返回 -1
    ├── bus.ts            # 录制状态机（start / end）+ 实时聚合 Map + 同步触发 reporter
    ├── types.ts          # Reporter / AggResult 类型
    └── reporters/
        └── console.ts    # createConsoleReporter / consoleReporter（直接遍历 Map）
```

`package.json` 关键字段：

```json
{
  "name": "@mpxjs/perf",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "sideEffects": false,
  "peerDependencies": {
    "@mpxjs/webpack-plugin": "^2.10.0"
  }
}
```

放在 `packages/perf/` 而不是 `packages/webpack-plugin/lib/runtime/perf/` 的理由：

1. **运行时复用**：业务侧 RN 项目里非 `.mpx` 的纯 RN 代码（封装、列表项、外置 hook）也想点缀探针时，可以直接 `import { scopeStart, scopeEnd } from '@mpxjs/perf'` 接入同一根 reporter 通道。
2. **跨端复用**：未来 web / harmony 想接入只需复用同一包；常量开关由 webpack-plugin 注入，包本体不感知 mode。
3. **`sideEffects: false` 治理更干净**：单独包的 `package.json` 字段更明确，业务方 webpack / metro 配置识别更稳。
4. **构建 / 发版独立**：探针包后续可以独立打 patch（增加 reporter、调整 bus 策略）而不必等 webpack-plugin 一起发版。

`@mpxjs/webpack-plugin` 与 `@mpxjs/perf` 的关系：

- `webpack-plugin` 注入 `__mpx_perf__` / `__mpx_perf_framework__` / `__mpx_perf_user__` 等 DefinePlugin 常量。
- `webpack-plugin` 内的 RN 运行时组件 `import * as perf from '@mpxjs/perf'`，所有探针包在 `if (__mpx_perf_framework__) ...` 里。
- 业务侧在自家 RN 代码里同样 `import * as perf from '@mpxjs/perf'`，但探针包在 `if (__mpx_perf_user__) ...` 里。框架与业务共用同一根 bus 与 reporter。
- **`@mpxjs/perf` 的 API 是同一套**——`scopeStart / scopeEnd / mark / measure / start / end / setReporter / clearReporter`，不分子命名空间；分组的区分**完全由调用方的字面量条件决定**，包内部只看 `__mpx_perf__` 总开关。

#### 3.1 `src/index.ts` —— 只用总开关 `__mpx_perf__` 分流

```ts
import * as impl from './impl'
import * as noop from './noop'
import * as reporters from './reporters/console'

// 总开关 true → 走 impl；总开关 false → 全部 noop
export const scopeStart = __mpx_perf__ ? impl.scopeStart : noop.scopeStart
export const scopeEnd   = __mpx_perf__ ? impl.scopeEnd   : noop.scopeEnd
export const mark       = __mpx_perf__ ? impl.mark       : noop.mark
export const measure    = __mpx_perf__ ? impl.measure    : noop.measure

// 录制控制 API：start 开启录制 / end 停止并同步触发 reporter
export const start = __mpx_perf__ ? impl.start : noop.start
export const end   = __mpx_perf__ ? impl.end   : noop.end

export const setReporter   = __mpx_perf__ ? impl.setReporter   : noop.setReporter
export const clearReporter = __mpx_perf__ ? impl.clearReporter : noop.clearReporter

// 内置 reporter 工厂：与上面 API 同样走三元分流；关闭态下整段被 DCE
export const createConsoleReporter = __mpx_perf__ ? reporters.createConsoleReporter : noop.createConsoleReporter
export const consoleReporter       = __mpx_perf__ ? reporters.consoleReporter       : noop.consoleReporter

export type { Reporter, AggResult } from './types'
```

写成 `__mpx_perf__ ? impl.x : noop.x` 顶层赋值而不是 `if (__mpx_perf__) export ...`：DefinePlugin 替换后变成 `false ? impl.x : noop.x`，Terser 消除整个 `impl.x` 引用 + `./impl` 没有任何活引用 → 模块整体被 tree-shake。

> `@mpxjs/perf` 自己**不感知**分组开关——它总是导出真实实现 + noop 两份；常量替换由**使用方**（webpack-plugin / 业务侧）的 webpack 构建上下文中由 DefinePlugin 完成。这意味着 `@mpxjs/perf` 必须以**未压缩、未编译**的源码形式被引用（`main: "src/index.ts"`），让 webpack 的 ts-loader / babel-loader + Terser 在最终构建里完成 DCE。如需发布编译后 `dist/` 形式，要保留三元判断的字面量结构，不允许被 babel-preset-env 等变换破坏。

#### 3.2 `noop.ts` —— 纯空 inline 函数

```ts
import type { Reporter } from './types'

// scopeStart 关闭态恒返回 -1，与开启态未录制时的语义一致；
// 调用方 `let id = -1; ...; perf.scopeEnd(id)` 在关闭态下被 inline 后等价于
// `let id = -1`，配合 Terser DCE 整段消失。
export const scopeStart = (_name: string): number => -1
export const scopeEnd   = (_id: number) => {}

export const mark    = (_name: string) => {}
export const measure = (_name: string, _start: string) => {}

export const start = () => {}
export const end   = (_reporter?: Reporter) => {}

export const setReporter   = (_r: Reporter) => {}
export const clearReporter = () => {}

export const consoleReporter: Reporter = (_agg) => {}
export const createConsoleReporter = (_options?: object): Reporter => (_agg) => {}
```

#### 3.3 `impl.ts` —— 真实实现

```ts
import { bus } from './bus'
import type { Reporter } from './types'

// 优先 performance.now（DOM / RN web）→ Hermes nativePerformanceNow → Date.now 兜底。
const now: () => number = (() => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return () => performance.now()
  }
  const g = (typeof globalThis !== 'undefined' ? globalThis : undefined) as
    | { nativePerformanceNow?: () => number } | undefined
  if (g && typeof g.nativePerformanceNow === 'function') {
    const native = g.nativePerformanceNow
    return () => native()
  }
  return () => Date.now()
})()

// 跨作用域起止配对：mark 名→时间戳
const marks = new Map<string, number>()

// 进行中的 scope：平行数组 + freeList 池，零闭包分配
const stackName: (string | null)[] = []
const stackStart: number[] = []
const freeList: number[] = []
let stackTop = 0

export function scopeStart (name: string): number {
  if (!bus.isRecording()) return -1
  const id = freeList.length > 0 ? freeList.pop()! : stackTop++
  stackName[id] = name
  stackStart[id] = now()
  return id
}

export function scopeEnd (id: number): void {
  if (id < 0) return
  const name = stackName[id]
  if (name === null) return       // 重复 end 安全 noop
  const dur = now() - stackStart[id]
  stackName[id] = null
  freeList.push(id)
  bus.pushMeasure(name, dur)
}

export function mark (name: string) {
  marks.set(name, now())
}

export function measure (name: string, start: string) {
  const s = marks.get(start)
  if (s === undefined) return
  const dur = now() - s
  marks.delete(start)              // 用过即清，避免下一轮误命中旧时间戳
  bus.pushMeasure(name, dur)
}

export const start = () => bus.start()
export const end   = (reporter?: Reporter) => bus.end(reporter)
export const setReporter   = (r: Reporter) => bus.setReporter(r)
export const clearReporter = ()             => bus.setReporter(undefined)
```

#### 3.4 `bus.ts` —— 录制状态机 + 实时聚合

只有在 `start()` 与 `end()` 之间触发的探针才会被录制，其余时间 `pushMeasure` 直接丢弃。`end()` 同步把当前窗口的聚合 Map 交给全局 reporter；`end(localReporter)` 会对同一份 Map 再追加一次局部上报，不会替换全局 reporter。**默认 reporter 是 `consoleReporter`**，业务不调 `setReporter` 也能看到 console 输出。

```ts
import type { AggResult, Reporter } from './types'
import { consoleReporter } from './reporters/console'

let _reporter: Reporter | undefined = consoleReporter
let _recording = false
// 每次 start 重建新 Map：end 交出的引用归调用方私有，业务异步消费安全。
// 窗口级别一次小分配可忽略；窗口期间桶数 = 唯一事件名数，远低于事件流的样本数。
let aggMap = new Map<string, AggResult>()

function runReporter (reporter: Reporter, agg: Map<string, AggResult>) {
  try { reporter(agg) } catch (e) { /* 吞掉 reporter 错误，不影响业务 */ }
}

export const bus = {
  setReporter (r: Reporter | undefined) { _reporter = r },

  start () {
    if (_recording) return         // 幂等，沿用已有窗口
    _recording = true
    aggMap = new Map()
  },

  end (reporter?: Reporter) {
    if (!_recording) return        // 未 start 直接 end 是 noop
    _recording = false
    if (aggMap.size === 0) return
    // 一次性回填 avg，push 阶段不算除法
    for (const s of aggMap.values()) s.avg = s.count ? s.sum / s.count : 0
    if (_reporter) runReporter(_reporter, aggMap)
    if (reporter)  runReporter(reporter,  aggMap)
  },

  isRecording (): boolean { return _recording },

  pushMeasure (name: string, dur: number) {
    if (!_recording) return
    let s = aggMap.get(name)
    if (!s) { s = { count: 0, sum: 0, avg: 0, max: 0 }; aggMap.set(name, s) }
    s.count++
    s.sum += dur
    if (dur > s.max) s.max = dur
  }
}
```

设计要点：

- **默认 reporter 是 `consoleReporter`**——业务侧最小心智模型只有 `start() / end()` 两个 API；`setReporter` 仅在想换上报通道（自定义函数 / `createConsoleReporter({...})` 自定义参数 / 自家 APM）时才需要调。
- **`end(localReporter)` 是一次性追加通道**：全局 reporter 照常触发，局部 reporter 只在当前窗口结束时同步收到同一份 Map，不改后续窗口的全局配置。
- **`end()` 在没有 reporter 时仍执行清理**：`_recording = false` 一定会走。
- **`end` 把 Map 交给两个 reporter 共享同一引用**：reporter 不应修改它；如需保留请自行复制（旧引用归本窗口私有，下一次 `start()` 会另起新 Map 不会污染）。
- **空窗口不触发 reporter**：`aggMap.size === 0` 时 end 直接返回，避免无聊的空表输出。
- **不引入 `flush()` 或自动定时器**：`end()` 即「停录 + 同步上报」的合并语义，零后台 timer。
- **`@mpxjs/perf` 默认依赖 `./reporters/console`**：默认 reporter 直接 import，关闭态由总开关 DCE 链路一并剔除——这条 import 不是新的活路径。

显式录制窗口模型的语义价值：

1. **录制范围明确**——业务在「点击进入页面 → 关键交互完成」之间 start / end，统计就是这段窗口的真实数据，不会被进入前的初始化、退出后的兜底渲染污染。
2. **统计结果同步可见**——`end()` 同步把累积聚合交给 reporter，调用 `end()` 那一行之后立即在 console 看到结果，调试切场景手感顺。
3. **零后台开销**——未 start 时 push 直接丢，没有持续的 timer / 缓冲，待机态开销仅一次 `if (!_recording) return` 比较。
4. **跨周期统计自然**——业务想看「整个购物流程」聚合，调一次 start、走完流程再 end 即可。

业务侧用户探针的标准模板（与框架探针完全对称，只是把字面量条件换成 `__mpx_perf_user__`）：

```tsx
import { scopeStart, scopeEnd } from '@mpxjs/perf'

function expensiveCompute (data) {
  let id = -1
  if (__mpx_perf_user__) id = scopeStart('myBiz:list:filter')
  const result = data.filter(/* ... */).sort(/* ... */)
  if (__mpx_perf_user__) scopeEnd(id)
  return result
}
```

事件名建议加业务前缀（`myBiz:` / 模块名 / 业务线代号）以与框架的 `view: / text: / getStyle:` 区分，reporter 拿到完整 Map 时按前缀分流即可分别上报。

### 4. 接入模板

只测同步 render 阶段，**不**使用 `useEffect`。**统一用 `scopeStart / scopeEnd` 句柄**——total 与子阶段都是同一个同步函数体内的起止，句柄写法贴合该场景，且只产生一种点缀样式。

#### 4.1 mpx-view 接入示例

[packages/webpack-plugin/lib/runtime/components/react/mpx-view.tsx](packages/webpack-plugin/lib/runtime/components/react/mpx-view.tsx) 改造模板（保持现有逻辑不动，只在关键节点点缀）：

```tsx
import * as perf from '@mpxjs/perf'

const _View = forwardRef<HandlerRef<View, _ViewProps>, _ViewProps>((viewProps, ref): JSX.Element => {
  let idTotal = -1
  if (__mpx_perf_framework__) idTotal = perf.scopeStart('view:render:total')

  // ───── props 阶段 ─────
  let idProps = -1
  if (__mpx_perf_framework__) idProps = perf.scopeStart('view:render:props')
  const { textProps, innerProps: props = {} } = splitProps(viewProps)
  let { /* 解构若干 props */ } = props
  const enableHover = !!hoverStyle
  const { isHover, gesture } = useHover({ enableHover, hoverStartTime, hoverStayTime })
  const styleObj = extendObject({}, defaultStyle, style, isHover ? hoverStyle : {})
  if (__mpx_perf_framework__) perf.scopeEnd(idProps)

  // ───── style 阶段 ─────
  let idStyle = -1
  if (__mpx_perf_framework__) idStyle = perf.scopeStart('view:render:style')
  const { normalStyle, hasSelfPercent, /* ... */ } = useTransformStyle(styleObj, { /* ... */ })
  const { textStyle, backgroundStyle, innerStyle = {} } = splitStyle(normalStyle)
  const textPassThrough = useTextPassThroughValue(textStyle, textProps)
  const { layoutRef, layoutStyle, layoutProps } = useLayout({ /* ... */ })
  const viewStyle = extendObject({}, innerStyle, layoutStyle)
  const { enableStyleAnimation, animationStyle } = useAnimationHooks({ /* ... */ })
  if (__mpx_perf_framework__) perf.scopeEnd(idStyle)

  // ───── innerProps 阶段 ─────
  let idInnerProps = -1
  if (__mpx_perf_framework__) idInnerProps = perf.scopeStart('view:render:innerProps')
  const innerProps = useInnerProps(/* ... */)
  if (__mpx_perf_framework__) perf.scopeEnd(idInnerProps)

  // ───── createElement 阶段 ─────
  let idCreate = -1
  if (__mpx_perf_framework__) idCreate = perf.scopeStart('view:render:createElement')
  const childNode = wrapWithChildren(props, { /* ... */ })
  let finalComponent: JSX.Element = enableStyleAnimation
    ? createElement(Animated.View, innerProps, childNode)
    : createElement(View, innerProps, childNode)
  if (enableHover) finalComponent = createElement(GestureDetector, { gesture }, finalComponent)
  if (hasPositionFixed) finalComponent = createElement(Portal, null, finalComponent)
  if (__mpx_perf_framework__) perf.scopeEnd(idCreate)

  if (__mpx_perf_framework__) perf.scopeEnd(idTotal)
  return finalComponent
})
```

#### 4.2 强约束

1. **字面量条件**：所有探针调用必须直接包在 `if (__mpx_perf_framework__)`（框架探针）/ `if (__mpx_perf_user__)`（业务探针）字面量条件里，**不能**先把常量赋给变量再用——只有字面量条件才能被 DefinePlugin + Terser DCE 静态消除。绝**不要**跨类混用（在框架代码里用 user 常量 / 反之）。
2. **不引入 useEffect 探针**：首版只测同步 render，避免 hook 顺序漂移；commit 阶段耗时如未来需要，再单独评估。
3. **统一句柄风格**：所有探针（含 total）都用 `let id = -1; if (...) id = scopeStart(name); ...; if (...) scopeEnd(id)` 模板。不要混用 `mark + measure`——同步函数体内 `scopeStart / scopeEnd` 已足够；`mark + measure` 仅在「起止跨作用域」（例如未来某天需要从 render 测到 useEffect）时才需要。
4. **scopeStart / scopeEnd 必须配对**：用 `let id = -1` 提前声明，再 `if (__mpx_perf_framework__) id = scopeStart(...)` / `if (__mpx_perf_framework__) scopeEnd(id)`——这样关闭态下整组语句被 DCE 删除。**不要**写成 `const id = <常量> ? scopeStart(...) : -1`，那会把字面量字符串和分支保留在产物里。
5. **total 与子阶段并列**：`*:total` 包整个函数体，子阶段拆 total 内连续代码段。子阶段相加 ≈ total，差值 = 函数自身的解构 / 调用开销，能直接看出"是子阶段慢还是骨架慢"。

### 5. 首批接入点与事件 schema

首版接入四个内建组件 + 一个 core mixin 方法。**统一只测同步 render 耗时**（不含 `useEffect`、不含 commit 后副作用），再按各自结构拆出几个主要的细分阶段。每个组件都至少产出一个 `*:render:total` 总耗时，加若干 `*:render:<phase>` 子阶段；细分阶段的 `sum` 加起来约等于 `total`，方便做占比分析。

事件名使用 `<owner>:render:<phase>` 命名，全局统一，业务侧可以按 `owner` 前缀过滤。

#### 5.1 [mpx-view.tsx](packages/webpack-plugin/lib/runtime/components/react/mpx-view.tsx)

| 事件名 | 覆盖代码段 |
| --- | --- |
| `view:render:total` | 整个 `forwardRef` 回调（最外层，含子阶段） |
| `view:render:props` | `splitProps` + 解构 + `useHover` |
| `view:render:style` | `useTransformStyle` + `splitStyle` + `useTextPassThroughValue` + `useLayout` + `useAnimationHooks`（产出 `animationStyle` 也属于算 style） |
| `view:render:innerProps` | `useInnerProps` |
| `view:render:createElement` | `wrapWithChildren` + `createElement(View / Animated.View / GestureDetector / Portal)` 收尾 |

#### 5.2 [mpx-simple-view.tsx](packages/webpack-plugin/lib/runtime/components/react/mpx-simple-view.tsx)

简化版 view（无 `useTransformStyle` / `useLayout` / `useHover` / `useAnimationHooks`）：

| 事件名 | 覆盖代码段 |
| --- | --- |
| `simple-view:render:total` | 整个函数 |
| `simple-view:render:style` | `splitProps` + `splitStyle`（含 `isBoxSizingAffectingStyle` 副检测） + `useTextPassThroughValue` + `transformBoxSizing` |
| `simple-view:render:innerProps` | `useInnerProps`（合并 listeners 与最终 style） |
| `simple-view:render:createElement` | `wrapChildren` + `createElement(View, ...)` 收尾 |

#### 5.3 [mpx-text.tsx](packages/webpack-plugin/lib/runtime/components/react/mpx-text.tsx)

完整版 text，与 §5.1 mpx-view 子阶段对齐（`total / props / style / innerProps / createElement`）：

| 事件名 | 覆盖代码段 |
| --- | --- |
| `text:render:total` | 整个 `forwardRef` 回调 |
| `text:render:props` | `useContext(TextPassThroughContext)` + `extendObject` 合并 inherited + 解构 |
| `text:render:style` | `useTransformStyle` + `extendObject` 合并 inherited textStyle + `splitStyle`（提取 childTextStyle） + `useTextPassThroughValue` + `useNodesRef` |
| `text:render:innerProps` | `useInnerProps` |
| `text:render:createElement` | `decode` + `wrapChildren` + `createElement(Text / Portal)` 收尾 |

#### 5.4 [mpx-simple-text.tsx](packages/webpack-plugin/lib/runtime/components/react/mpx-simple-text.tsx)

与 §5.2 mpx-simple-view 子阶段对齐（`total / style / innerProps / createElement`）：

| 事件名 | 覆盖代码段 |
| --- | --- |
| `simple-text:render:total` | 整个函数 |
| `simple-text:render:style` | `useContext(TextPassThroughContext)` + 合并 mergedStyle + `splitStyle`（含 `isBoxSizingAffectingStyle` 副检测） + `transformBoxSizing` + 合并 mergedProps + `useTextPassThroughValue` |
| `simple-text:render:innerProps` | `useInnerProps`（带 allowFontScaling / 最终 style） |
| `simple-text:render:createElement` | `wrapChildren` + `createElement(Text, ...)` 收尾 |

#### 5.5 [@mpxjs/core: __getStyle](packages/core/src/platform/builtInMixins/styleHelperMixin.ios.js)

`__getStyle` 是每个 mpx 组件 render 时都会被调一次的样式聚合入口：

| 事件名 | 覆盖代码段 |
| --- | --- |
| `getStyle:total` | 整个 `__getStyle` 函数 |
| `getStyle:class` | classString 解析 + 遍历 `__getClassStyle` / `__getAppClassStyle` / externalClasses 查找 |
| `getStyle:style` | `parseStyleText(staticStyle)` + `normalizeDynamicStyle(dynamicStyle)` + `transformStyleObj(styleObj)` |

`getStyle:total` 与两个子阶段并列，子阶段相加 ≈ total，差值代表函数自身骨架（`isNativeStyle` 判定 / `__getSizeCount` / `hide` 分支等）开销。

---

每处接入都遵循「点缀 + 字面量条件 `if (__mpx_perf_framework__)`」原则（业务侧用 `__mpx_perf_user__`），不抽象「自动埋点 HOC」之类的二次封装——HOC 会引入额外组件层、影响测量基线，且抽象会让 DCE 更难判断纯净。

**统一约定**：

- 只测**同步 render 阶段**，不在 `useEffect` 里测 commit 耗时。
- 统一使用 `scopeStart(name)` / `scopeEnd(id)` 起止包裹（包括 `*:total` 与子阶段），不混用 `mark + measure`。
- 子阶段名固定枚举（见上方各表），不允许临时新加。新增 / 修改子阶段需要同步改本节文档与对应单测期望值。

### 6. 上报形态

**默认 reporter 是 `consoleReporter`**——业务方什么都不调，开启探针并 `start() / end()` 后 console 即有聚合表，零接入门槛。`setReporter` 仅在「想换长期上报通道」时才需要调，是可选 API；临时单次上报可使用 `end(localReporter)`，不影响全局 reporter。

可选的两种替代形态：

- `createConsoleReporter({ sortBy / filter / header })`：定制 console 输出（见 §6.2）。
- `(agg: Map<string, AggResult>) => void` 自定义函数：接入业务自家 APM、写入本地文件等（见 §6.3）。

webpack-plugin 不参与 reporter 注入，只负责通过常量决定探针字节是否进入产物（理由见 §1）。可视化场景（火焰图、时间轴等）由业务侧基于自定义 reporter 自行实现，不在本方案范围内。

#### 6.1 console reporter 的聚合形态

bus 在 push 阶段已完成实时聚合，console reporter 不再做二次聚合，只是把 Map 排序后打印：

```ts
// packages/perf/src/reporters/console.ts
import type { AggResult, Reporter } from '../types'

export const createConsoleReporter = (options = {}): Reporter => (agg) => {
  const { sortBy = 'sum', filter, header = true } = options
  const rows: Row[] = []
  let totalCount = 0
  for (const [name, s] of agg) {
    if (filter && !match(filter, name)) continue
    totalCount += s.count
    rows.push({ name, count: s.count, sum: s.sum, avg: s.avg, max: s.max })
  }
  rows.sort((a, b) => b[sortBy] - a[sortBy])
  // ...列宽计算 + console.group + console.log 对齐字符串
}
```

输出形式刻意避开 `console.table`——React Native 远程调试 / Hermes inspector 对它支持参差不齐（典型表现是把每行渲染成 `{…}` 不展开），改成对齐字符串 + 单条 `console.log`，在 RN console、Chrome DevTools、终端 Node 中都能直接读：

```
[mpx perf] 4 buckets / 432 samples
name                count       sum      avg       max
------------------  -----  --------  -------  --------
view:render:total     120  480.32ms   4.00ms   18.21ms
view:render:style     120   92.15ms   0.77ms    3.42ms
getStyle:total        120   21.08ms   0.18ms    1.10ms
text:render:total      84    8.42ms   0.10ms    0.55ms
```

#### 6.2 console reporter 工厂参数（可选）

如果默认 console 输出不满足，调 `setReporter(createConsoleReporter({...}))` 替换：

```ts
// App.tsx
import { setReporter, createConsoleReporter } from '@mpxjs/perf'

if (__mpx_perf__) {
  setReporter(createConsoleReporter({
    sortBy: 'max',          // 'sum'(默认) | 'avg' | 'max' | 'count'
    filter: /^view:/,       // 仅打印匹配的事件名
    header: true            // 是否带 console.group 头
  }))
}
```

默认 reporter 行为等价于 `createConsoleReporter()` 默认参数。

#### 6.3 业务自定义 reporter（可选）

替换默认 console，把数据接到自家 APM：

```ts
// App.tsx
import { setReporter } from '@mpxjs/perf'
import type { AggResult } from '@mpxjs/perf'

if (__mpx_perf__) {
  setReporter((agg: Map<string, AggResult>) => {
    // agg 是 bus 内部 Map 的引用，不要直接修改；如需保留请自行复制成普通对象。
    const fw: Record<string, AggResult> = {}
    const user: Record<string, AggResult> = {}
    const FW = /^(view:|simple-view:|text:|simple-text:|getStyle:)/
    for (const [name, s] of agg) (FW.test(name) ? fw : user)[name] = s
    MyAPM.report('mpx_perf_fw',   fw)
    MyAPM.report('mpx_perf_user', user)
  })
}
```

外层用 `if (__mpx_perf__)` 包住注册行为：总开关为 false 时整段被 DCE 删除，业务自定义 reporter 函数 + 闭包字节也一并消失。**不要**写成 `setReporter(__mpx_perf__ ? myFn : undefined)`——`setReporter` 在关闭态本身已是 noop，但 `myFn` 引用没被字面量条件包裹，仍可能被 webpack 视作活引用。

切换 reporter 直接再调一次 `setReporter(otherReporter)`。如果想完全停止上报，调 `clearReporter()` 即可——之后 end 收集到的聚合 Map 被静默丢弃。

> **分位数（p50 / p95）的取舍**：本方案实时聚合 only、不保留逐条样本，因此 reporter 拿不到 dur 序列，无法计算分位。需要分位的业务在调用点自行采样并写入业务自有数据通道。该取舍是为了在高频渲染场景下避免事件对象 / 闭包分配引发的 GC 压力，符合目标 5。

#### 6.4 录制窗口（start / end）

录制由业务侧显式控制——`start()` 打开窗口、`end()` 关闭并把当前窗口的聚合 Map 同步交给 reporter。两者之间的探针才会被记录，其余时间所有 `scopeStart` / `mark` / `measure` 调用立即 return。

**典型场景**：

```ts
// 路由钩子：进入"商品详情"页 → 离开页面
import { start, end } from '@mpxjs/perf'

router.beforeEnter('/goods/:id', () => {
  if (__mpx_perf__) start()
})

router.beforeLeave('/goods/:id', () => {
  if (__mpx_perf__) end()           // end 内部同步触发 reporter，console 立即看到聚合表
})
```

```ts
// 交互按钮：点击「下单」前后录一段
const onSubmit = () => {
  if (__mpx_perf__) start()
  doSubmit()                         // 内部触发若干 mpx-view 重渲染、setState
  if (__mpx_perf__) end()
}
```

```ts
// React 组件级测速：useEffect 里跨整个挂载窗口
useEffect(() => {
  if (__mpx_perf__) start()
  return () => { if (__mpx_perf__) end() }
}, [])
```

**约定**：

- **`setReporter` 是可选**——默认 reporter 已是 `consoleReporter`，最小用法只用 `start / end`；想换上报通道才调 `setReporter`，通常在 `App.tsx` 入口注册一次。
- **不强制配对**：误调 `end()`（未先 start）是 noop；重复 `start()` 沿用已有窗口，幂等。
- **跨录制周期统计由业务自己合并**——bus 不内部累计；想做"全程聚合"就开一段长录制窗口，覆盖整个流程后再 end。
- **强制重开新窗口**：先 `end()` 再 `start()`，第二次 start 会丢弃旧聚合 Map 并新建一个空 Map。
- **end 返回的 Map 引用在业务异步消费期间安全**：下一次 `start()` 不会清旧 Map，只是把 bus 的 `aggMap` 指向新 Map；业务持有的旧引用归本窗口私有。
- **不需要 try / finally 保护 end**：忘记 end 不会导致内存泄漏——聚合 Map 桶数 = 唯一事件名数，业务侧名集合通常有限。

## 关闭态零残留的论证

「关闭态」分两种：

- **完全关闭**：`__mpx_perf__: false`（即所有分组都关）。
- **半开半闭**：只开部分分组。此时其他分组的探针字节也必须被 DCE。

DefinePlugin 把对应常量静态替换为 `false` 后，Terser 会做以下变换：

1. `if (false) { perf.scopeStart(...) }` → 整个分支删除（按调用方写的常量决定哪些段消失）。
2. 顶层 `false ? impl.x : noop.x` → `noop.x`，所有对 `impl.x` 的引用消失（**仅完全关闭时触发**）。
3. `impl.ts` 没有任何活引用 → 在 webpack 的 module concatenation / `usedExports` 阶段被标记为未使用 → 不进入 chunk。
4. `impl.ts` 引用的 `bus.ts` / `reporters/*.ts` 同样级联消失。
5. `noop.ts` 的空函数被 Terser inline 后调用点也被消除（`scopeStart` 关闭态返回 `-1`，`scopeEnd` 是空函数，整段 `let id = -1; ...; perf.scopeEnd(id)` 被简化为 `let id = -1` 后再被 DCE 完全删除）。

因此完全关闭态产物里既不存在探针代码，也不存在 `'view:render:total'` 这种字符串字面量。半开半闭态下：开启的分组点缀代码进入产物，关闭的分组整段被 DCE（事件名字面量、`scopeStart()` 调用都不残留），impl 模块仍进 bundle。`@mpxjs/perf` 的 `package.json` 设置 `"sideEffects": false` 是这条链路的关键。

## 性能影响评估

| 状态 | 关闭 | 打开 + 未录制（未 start） | 打开 + 录制中 |
| --- | --- | --- | --- |
| 单次 scope 额外耗时 | 0 | 一次 `isRecording()` 比较 → return | 状态判断 + freeList 取 id + 1 次 `now()` + 2 次数组下标写 + `pushMeasure` 的 `Map.get` + 数值累加 |
| 单次 scope 堆分配 | 0 | 0 | 0（仅首次出现新桶时分配一个 `AggResult` 对象） |
| 内存 | 0 | 0（scopeStart 直接返回 `-1`） | 桶数 × `AggResult`（~40 字节）。桶名通常 < 50 个，远低于事件流模型 |
| Hook 调用顺序 | 不变 | 不变（同一构建内常量恒定） | 不变 |
| reporter 触发开销 | 无 | 无 | 仅 `end()` 触发一次同步调用，不在热路径上重复跑 |

**与旧事件流模型对比**：

| 维度 | 事件流模型 | 实时聚合模型 |
| --- | --- | --- |
| 单次 scope 分配 | 1 个事件对象 + 1 个 stop 闭包 | 0 |
| 队列上限风险 | 4096 后 `queue.shift()` 是 O(n)，长录制悬崖 | 无队列 |
| 内存上限 | 4096 条事件 × ~50B ≈ 200KB | 桶数 × ~40B ≈ < 2KB |
| 高频渲染（一帧 1000+ scope） | 2000+ 短命对象 / 帧，触发 minor GC | 桶稳态后零分配 |
| reporter 入参 | `PerfEvent[]` | `Map<string, AggResult>`（已聚合） |
| p50 / p95 / 直方图 | 可基于 events 计算 | **不支持**（取舍） |

打开态测得的耗时本身仍含探针自身开销（一次 `now()` + 数组下标写 + Map 累加），方案文档需要明确告知业务方「探针开关切换会影响绝对耗时，对比应当在同一开关态下进行」。

## 与现有方案的关系

- 与 `__DEV__`：`__DEV__` 区分开发 / 生产环境，无法支持「生产构建里临时开探针」；而 `__mpx_perf_framework__` / `__mpx_perf_user__` 是构建参数，可以打一个生产 + 开探针的内测包。
- 与 Hermes Profiler：Hermes 看 JS 函数级耗时，看不到 mpx 抽象（`useTransformStyle` 内部是若干小函数 + Hook，非单一函数）。本方案产生的 scope 时间戳与 Hermes 时间轴对齐（都用 `performance.now()` / `nativePerformanceNow`），可以一起分析。
- 与现有埋点 / 监控：本方案不替代业务 APM，只提供数据源；业务可用自定义 reporter 把聚合结果接入既有上报通道。

## 落地路线

一次 PR 完整落地基础设施 + 接入点。改动覆盖三个包：`@mpxjs/perf`（新建）、`@mpxjs/webpack-plugin`（扩配置 + 接入点）、`@mpxjs/core`（接入 `__getStyle`）。

### 改动清单

#### 新建 `packages/perf/`

```
packages/perf/
├── package.json          # name: @mpxjs/perf, sideEffects: false, main: src/index.ts
├── README.md             # 接入说明 + 事件 schema + Terser 兼容性约束
├── tsconfig.json
├── __tests__/
│   ├── impl.test.ts      # scopeStart/End / mark / measure 行为
│   └── bus.test.ts       # setReporter / start / end 状态机 / 未录制即丢弃 / 聚合累加
└── src/
    ├── index.ts
    ├── impl.ts
    ├── noop.ts
    ├── bus.ts
    ├── types.ts
    └── reporters/
        └── console.ts
```

monorepo 工作区配置：根 `pnpm-workspace.yaml` / `lerna.json` 把 `packages/perf` 纳入。`@mpxjs/webpack-plugin` 与 `@mpxjs/core` 的 `dependencies` 增加 `@mpxjs/perf`（workspace 协议）。

#### `@mpxjs/webpack-plugin`

- [lib/index.js](packages/webpack-plugin/lib/index.js) options 归一化新增 `perf` 字段，形态为 `{ enable: boolean, probes: string[] }`；defs 注入 `__mpx_perf__`（总开关）+ `__mpx_perf_framework__` / `__mpx_perf_user__`（按 `probes` 包含关系派生）。`probes` 中出现未知值时抛 `unknown probe` 错误。
- [lib/global.d.ts](packages/webpack-plugin/lib/global.d.ts) 追加 `declare const __mpx_perf__: boolean`、`declare const __mpx_perf_framework__: boolean` 与 `declare const __mpx_perf_user__: boolean`。
- [lib/runtime/components/react/mpx-view.tsx](packages/webpack-plugin/lib/runtime/components/react/mpx-view.tsx)：按 §5.1 接入 5 个事件名（`view:render:total` + 4 子阶段），参考 §4.1 模板。
- [lib/runtime/components/react/mpx-simple-view.tsx](packages/webpack-plugin/lib/runtime/components/react/mpx-simple-view.tsx)：按 §5.2 接入 4 个事件名（`simple-view:render:total` + 3 子阶段 `style / innerProps / createElement`）。
- [lib/runtime/components/react/mpx-text.tsx](packages/webpack-plugin/lib/runtime/components/react/mpx-text.tsx)：按 §5.3 接入 5 个事件名（`text:render:total` + 4 子阶段 `props / style / innerProps / createElement`）。
- [lib/runtime/components/react/mpx-simple-text.tsx](packages/webpack-plugin/lib/runtime/components/react/mpx-simple-text.tsx)：按 §5.4 接入 4 个事件名（`simple-text:render:total` + 3 子阶段 `style / innerProps / createElement`）。

#### `@mpxjs/core`

- [src/platform/builtInMixins/styleHelperMixin.ios.js](packages/core/src/platform/builtInMixins/styleHelperMixin.ios.js)：按 §5.5 接入 3 个事件名（`getStyle:total` + 2 子阶段）。`__getStyle` 被每个 mpx 组件 render 调一次，是除内建组件外测速的核心入口。

> 注意：`styleHelperMixin.ios.js` 是 RN 平台特化文件，不影响小程序 / web 产物。其他平台对应的 `styleHelperMixin.js` 不做改动——`__mpx_perf_framework__` 在非 RN mode 下也置为 false 即可（DCE 在其他平台天然不触发）。

### 验证步骤

落地后按以下顺序自检：

1. **完全关闭态零残留**：默认（不传 `perf`）打包一份 RN bundle，全文搜不到 `__mpx_perf_framework__` / `__mpx_perf_user__` / `view:render:total` / `getStyle:total` / `@mpxjs/perf` 等字符串字面量；产物 size 与未加该 PR 的 baseline 字节级一致。
2. **打开态可用（默认 reporter）**：`perf: { enable: true, probes: ['framework', 'user'] }` 打包，业务 demo **不需要调 `setReporter`**，直接 `if (__mpx_perf__) start(); /* 触发若干渲染 */; if (__mpx_perf__) end()`，end 调用同步在 console 打印一次聚合表（默认 `consoleReporter`）。
3. **clearReporter 即静默**：打开探针但**调 `clearReporter()`**，console 应无任何 perf 输出，且 JS 堆内存与「关闭态」对比无明显增长。
4. **半开半闭 DCE 验证**：`{ enable: true, probes: ['framework'] }` 打包，全文搜不到业务侧 user 探针的事件名（如业务前缀 `myBiz:` 字符串字面量）；反向 `{ enable: true, probes: ['user'] }` 时搜不到 `view:render:total` / `getStyle:total` 等框架事件名。
5. **未知 probe 报错**：`{ enable: true, probes: ['unknownXxx'] }` 打包时编译期抛 `unknown probe` 错误。
6. **总耗时 ≈ 子阶段之和**：从 console 输出里抽一行 `view:render:total`，对照同周期其他 `view:render:*` 子阶段 sum 求和，差值 < 5%。
7. **getStyle 接入正确性**：单测打开 framework 探针，构造一个含 staticClass + dynamicStyle 的 mpx 组件，断言 `getStyle:class` / `getStyle:style` 各 count >= 1，`getStyle:total` count 与组件 render 次数一致。
8. **聚合语义正确性**：start → 多次 scope 同名 → end，断言聚合 Map 该桶的 count = 调用次数、sum = 各次 dur 之和、avg = sum/count、max = 各次 dur 最大值。
9. **跨窗口 Map 引用安全**：start → scope → end（保存返回的 Map 引用）→ 立即 start → end 一次新窗口，断言旧 Map 引用的桶数据未被覆盖。
10. **小程序 / web 不受影响**：mode=wx / web 打包，产物内不出现 `__mpx_perf_*__` 残留，跑现有 e2e 用例不退化。

### 文档

- `packages/perf/README.md`：API（scopeStart / scopeEnd / mark / measure / start / end / setReporter / clearReporter）、录制窗口语义、reporter 形态、reporter 注册时机指引、事件 schema、Terser / babel 兼容性约束、关闭态零残留原理。
- `docs-vitepress/guide/advance/perf.md`：把 4 个组件 + getStyle 的事件 schema 转成业务可读的速查表，附 console 输出样例与「如何读懂表格」（max 看长尾、sum 看占比、count × avg 看频率代价）。

## 风险与对策

| 风险 | 对策 |
| --- | --- |
| 业务方 webpack 关闭了 minimizer，导致探针字节残留 | 文档中明确「关闭态保证依赖 minimizer」；接入指南要求保留默认 Terser 配置 |
| 有人在 `if` 外写探针，漏掉常量保护 | review 模板加 checklist；接入文档给出标准点缀模板 |
| 框架代码错用 user 常量 / 业务代码错用 framework 常量 | review 强制：框架包内不允许出现 `__mpx_perf_user__` 字符串、业务接入文档示例只演示 `__mpx_perf_user__`；CI 可加文本 lint 规则 |
| Hook 顺序问题 | 两个常量都是同一构建内的 boolean 常量，天然不会在运行时切换；同一构建内 framework / user 分别恒定 |
| 探针自身污染测量结果 | 文档说明观测者效应；reporter 仅在 `end()` 同步触发一次，不在 render / scroll 等热路径上重复跑；建议 end 调用放在路由切换或交互结束点；实时聚合模型已把单次 scope 的堆分配降到 0，进一步压低观测者效应 |
| 业务期待 p50 / p95 / 直方图 | 文档明确「实时聚合 only，不支持分位」；需要分位的业务在调用点自行采样、写入业务自有通道 |
| 高频事件（onScroll）打爆聚合桶 | 实时聚合天然不打爆——桶数 = 唯一事件名数量，与样本数无关；高频名只是 count 累加，不增加内存 |
| 业务想看 console 表，但又怕忘配 reporter | 默认 reporter 即 `consoleReporter`——开了探针就有 console 输出，无需调 setReporter。如调过 `clearReporter()` 后忘记恢复，bus 直接丢弃数据，无内存堆积 |
| 未来 web / harmony 模式想接入 | `@mpxjs/perf` 是独立包，与渲染层解耦；只需 webpack-plugin 在对应 mode 下把常量置为生效，包本身无需改动 |
| `@mpxjs/perf` 以源码形式发布，业务侧 babel/tsc 配置不一致导致 DCE 失效 | README 写明对 babel-preset-env / Terser 的最低要求；提供一份"接入自检 webpack 配置"参考；必要时 fallback 提供 `dist/` 版但保持三元结构不被压平 |

## 演进方向

首版 `probes` 列表只允许 `'framework'` / `'user'` 两值 + `__mpx_perf__` 总开关，API 表面为 `scopeStart / scopeEnd / mark / measure / start / end / setReporter / clearReporter`。后续如出现以下需求再演进：

1. **新增分组维度**：如 navigation / network 单独成组，扩 `PERF_GROUPS` 数组 + 同步加 `declare const __mpx_perf_navigation__: boolean` 即可，业务方写 `probes: ['framework', 'navigation']`；`@mpxjs/perf` 包零改动。
2. **分组内细分子桶**：当某分组探针密度过高（如 framework 下的 `useTransformStyle` 在每个 view 上调用）导致测量噪声大、又确实想保留可选粒度时，把 `'framework.view'` / `'framework.style'` 这种带点的字符串纳入 `PERF_GROUPS`，配套生成 `__mpx_perf_framework_view__` 等常量；事件名 namespace 不变，点缀点改用细粒度常量做编译期 DCE。
3. **更多内置 reporter**：如 Chrome trace / Perfetto JSON 输出（需要时间戳，可从 scopeStart 的 stackStart 数组拿）。
4. **分位指标补充**：若 p50 / p95 真成为高频需求，可考虑增量加入 `t-digest` 等概率结构（每桶额外 ~1KB），仍不保留逐条事件；先在调用点采样 + 业务侧合并是首选方案。
5. **业务侧手动开关 sub-feature**（运行时变量）：明确不与"零残留"目标兼容，需新设计。

## 验收清单

- [ ] 不传 `perf` 时打包，产物 size 与未集成方案的 baseline 一致（diff 0 字节），人工抽查无 `__mpx_perf_*__` / `view:render:total` / `setReporter` / `scopeStart` 等字符串残留。
- [ ] `perf: { enable: true, probes: ['framework', 'user'] }` 且业务**不调 setReporter**（用默认 reporter）+ `start() / 触发渲染 / end()` 后，demo 中能在 console 看到 `view:render:*` / `text:*` / `getStyle:*` 等框架事件 + 业务自定义事件的聚合表。
- [ ] `perf: { enable: true, probes: ['framework'] }` 时：产物中无业务 user 探针字符串（如业务前缀 `myBiz:`）；end() 收到的 Map 仅含框架事件名。
- [ ] `perf: { enable: true, probes: ['user'] }` 时：产物中无 `view:render:total` / `getStyle:total` 等框架事件名；end() 收到的 Map 仅含业务事件名。
- [ ] `perf: { enable: true, probes: ['unknownXxx'] }` 时编译期抛 `unknown probe` 错。
- [ ] 录制窗口外（未 start 或已 end 后）触发探针：`scopeStart` 返回 `-1`、console 无输出、聚合 Map 长度为 0（无内存增长）。
- [ ] 误调 `end()`（未先 start）：noop，无报错、无 reporter 调用。
- [ ] 重复 `start()`：第二次 start 视为幂等，沿用已有窗口（已采集聚合不丢失）；先 `end()` 再 `start()` 则丢弃旧聚合 Map 重新录制。
- [ ] 探针开启 + 调 `clearReporter()` 后：start/end 仍可正常调用，end 静默丢弃数据，无报错。
- [ ] 业务自定义 `setReporter((agg) => void)` + start/end 后，能在回调中收到 `Map<string, AggResult>`，且不再触发默认 console 输出。
- [ ] `setReporter` 切换 / `clearReporter` / 之后再次 `setReporter`：每次 end 走当前注册的 reporter，clear 后到下次 setReporter 之间 end 都静默丢弃。
- [ ] reporter 抛异常时不影响业务运行（被 bus 内部 try/catch 吞掉）。
- [ ] 探针打开 / 关闭切换不引入新的 React 警告（Hook 顺序、key 等）。
- [ ] `mpx-view` 在 1k 节点列表场景下，完全关闭态与未集成方案的 baseline 帧率一致（容差 1%）。
- [ ] 打开态高频渲染（一帧 1000+ scope 调用）下，JS 堆内存增长曲线与关闭态对比无显著差异（实时聚合零分配的实证）。
- [ ] 跨窗口 Map 引用安全：start → end（保存 Map 引用）→ 立即 start → end，旧 Map 引用的桶数据未被覆盖。
- [ ] 文档中给出三档接入示例：默认（不调 setReporter）/ 调 `setReporter(createConsoleReporter({...}))` 定制 console / 调 `setReporter((agg) => ...)` 接入自家 APM；以及 framework / user 单独打开 / 同时打开三种典型用法说明，并给出路由钩子 / 交互按钮 / useEffect 三种 start / end 调用模板。
