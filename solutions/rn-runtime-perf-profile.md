# Mpx Perf 三类统计 API 与区段序列 Profile 方案

## 背景

`@mpxjs/perf` 当前提供两类数据：

- `scopeStart/scopeEnd`、`measureStart/measureEnd` 将多次区段耗时实时聚合为按 name 分桶的结果 Map。
- `mark` 将瞬时事件按发生顺序写入 `MarkTimeline`。

其中 `scope` 与 `measure` 的最终产物完全相同，区别只在起止配对方式：

- `scopeStart(name)` 返回数字 id，`scopeEnd(id)` 通过 id 配对，适合同步、嵌套和同名并发区段。
- `measureStart(name)` 不返回 id，`measureEnd(name)` 通过 name 配对，适合跨作用域区段，但同名并发时后一次 start 会覆盖前一次。

这形成了两套名称和四个公开 API，却只对应一种“区段聚类统计”能力。同时，现有时间线只能表达点事件，无法记录每次模块执行的开始时间与持续时长，因此不能生成模块火焰图、区段瀑布图或完整的执行 profile。

本方案将 Perf 的采集能力明确拆成三类：

| 统计类型 | 新 API | 输出 | 典型用途 |
| --- | --- | --- | --- |
| 区段聚类统计 | `aggrStart/aggrEnd` | `Map<string, AggrResult>` | 高频 render、hook、函数耗时的 count/sum/avg/max |
| 区段序列统计 | `traceStart/traceEnd` | `TraceTimeline` | 模块加载火焰图、嵌套调用 profile、异步区段瀑布图 |
| 点序列统计 | `mark` | `MarkTimeline` | 数据就绪、首次渲染、页面可交互等里程碑 |

录制窗口 `start/end`、Reporter 注册和编译期 DCE 机制保持不变。

## 目标

1. 新增可保留每次区段起点与持续时长的有界序列，支持生成模块火焰图一类 profile。
2. 使用 `aggrStart/aggrEnd` 统一现有 `scope` 与 `measure` 的聚类统计实现。
3. `aggrEnd` 和 `traceEnd` 均可通过数字 id 或字符串 name 配对。
4. `aggrStart` 和 `traceStart` 默认使用 id 模式；需要 name 模式时显式传入 `useName: true`。
5. `traceEnd(target, info?)` 与 `mark(name, info?)` 支持保存用户自定义信息。
6. `MarkEvent` 与 `TraceEvent` 统一使用 `start` 记录窗口内相对位置，并使用 `timestamp` 记录原始开始时间戳。
7. 保留 `scopeStart/scopeEnd`、`measureStart/measureEnd` 导出，并让它们内部调用 `aggrStart/aggrEnd`，兼容现有调用方。
8. 保持聚类热路径的零对象、零闭包分配特性；mark 与 trace 使用独立、默认 1024 且可由 `start(options)` 覆盖的窗口容量限制。
9. 延续 `__mpx_perf__` 顶层三元分流与调用方字面量门禁，关闭态继续保持零残留。

## 非目标

1. 不实现采样型 CPU profiler，不读取 Hermes 原生调用栈。
2. 不在首期内置火焰图 UI 或文件写入能力；Perf 提供稳定的区段序列，Reporter 可将其转换为 Chrome Trace、Perfetto 或业务 APM 格式。
3. 不为序列事件计算 p50/p95 等统计；需要聚类结果时使用 `aggrStart/aggrEnd`。
4. 不修改 webpack-plugin 的 `perf.enable`、`perf.probes` 和分组常量。
5. 不增加线上动态开关。
6. 不自动复制、序列化或校验用户传入的 `info`。

## API 设计

### 1. 区段聚类统计：`aggrStart/aggrEnd`

```ts
export function aggrStart (name: string, useName?: false): number
export function aggrStart (name: string, useName: true): void
export function aggrStart (name: string, useName: boolean): number | void
export function aggrEnd (target: number | string): void
```

`useName` 只决定配对方式，不改变最终聚合桶：

| 调用方式 | start 行为 | end 入参 | 并发语义 |
| --- | --- | --- | --- |
| `aggrStart(name)` | 返回数字 id，未录制时返回 `-1` | 同一个 id | 支持嵌套、乱序结束和同名并发 |
| `aggrStart(name, false)` | 同默认模式 | 同一个 id | 同默认模式 |
| `aggrStart(name, true)` | 以 name 保存起点，不返回 id | 同一个 name | 同名 start 后一次覆盖前一次 |

同步高频路径使用默认 id 模式：

```ts
import { aggrStart, aggrEnd } from '@mpxjs/perf'

let id = -1
if (__mpx_perf_framework__) id = aggrStart('view:render:style')
const style = useTransformStyle(props)
if (__mpx_perf_framework__) aggrEnd(id)
```

跨作用域场景使用 name 模式：

```ts
if (__mpx_perf_user__) aggrStart('goods:request', true)

loadPageData().finally(() => {
  if (__mpx_perf_user__) aggrEnd('goods:request')
})
```

两种方式都向同一个聚合 Map 写入 `{ count, sum, avg, max }`，不会进入区段序列或点序列。

为保持现有 `measureStart` 行为，聚类统计的 name 模式允许在录制窗口外保存起点；只有 `aggrEnd(name)` 发生在录制中时，最终样本才会被 bus 接收。id 模式继续沿用 `scopeStart` 的行为，未录制时直接返回 `-1` 且不读取时钟。

### 2. 区段序列统计：`traceStart/traceEnd`

```ts
export function traceStart (name: string, useName?: false): number
export function traceStart (name: string, useName: true): void
export function traceStart (name: string, useName: boolean): number | void
export function traceEnd (target: number | string, info?: unknown): void
```

配对规则与聚类 API 一致：

```ts
const appId = traceStart('module:app')
const routerId = traceStart('module:router')
traceEnd(routerId, { moduleId: 42 })
traceEnd(appId, { moduleId: 1 })
```

产出的区段序列按 `traceStart` 调用顺序排列：

```ts
{
  events: [
    { name: 'module:app', start: 1.2, timestamp: 1001.2, duration: 8.7, info: { moduleId: 1 } },
    { name: 'module:router', start: 2.1, timestamp: 1002.1, duration: 3.4, info: { moduleId: 42 } }
  ],
  dropped: 0,
  incomplete: 0
}
```

`start` 是相对当前录制窗口 `start()` 的毫秒偏移，`timestamp` 是 `traceStart` 读取的原始开始时间戳，`duration` 是区段持续时间。父子区段可通过时间包含关系还原为火焰图；发生交叉而非严格嵌套的异步区段，可由 Reporter 分配到不同 lane 展示。

name 模式用于不方便传递 id 的跨作用域区段：

```ts
if (__mpx_perf_user__) traceStart('request:goods', true)

loadPageData().finally(() => {
  if (__mpx_perf_user__) {
    traceEnd('request:goods', { status: 'fulfilled' })
  }
})
```

同名并发、递归调用或严格嵌套场景必须使用 id 模式。name 模式沿用“后一次 start 覆盖前一次”的简单语义，被覆盖而无法结束的前一区段会计入 `TraceTimeline.incomplete`。

与聚类 name 模式不同，trace 必须在录制窗口中 start：未录制时两种 `traceStart` 模式均为 noop，id 模式返回 `-1`。这是因为 trace 的 `start` 必须相对一个确定的窗口起点。

### 3. 点序列统计：`mark`

```ts
export function mark (name: string, info?: unknown): void
```

`mark` 保持现有点时间线语义，只增加可选 `info`：

```ts
if (__mpx_perf_user__) {
  mark('goods:data-ready', {
    source: 'cache',
    itemCount: 20
  })
}
```

同名 mark 继续保留为多条独立事件。未传 `info` 时不要求事件对象包含 `info` 属性；内建 start/end 边界也不携带 `info`。

### 4. 录制窗口配置

```ts
export interface PerfStartOptions {
  /** MarkTimeline 最大事件数，包含 start/end 边界，默认 1024。 */
  markLimit?: number
  /** TraceTimeline 最大区段数，默认 1024。 */
  traceLimit?: number
}

export function start (options?: PerfStartOptions): void
```

不传配置时两类序列的最大存储个数均为 1024；用户可在每次开启新窗口时分别覆盖：

```ts
start({
  markLimit: 2048,
  traceLimit: 4096
})
```

配置只在真正创建新窗口时读取并固定。录制中重复调用 `start(options)` 继续保持幂等，不清空数据，也不修改当前窗口容量。

`markLimit` 必须是不小于 2 的整数，为 start/end 边界各保留一个位置；`traceLimit` 必须是非负整数，传 `0` 可关闭当前窗口的 trace 存储。无效值回退到对应默认值 1024。

### 5. 完整导出面

```ts
import {
  // 区段聚类统计
  aggrStart,
  aggrEnd,

  // 区段序列统计
  traceStart,
  traceEnd,

  // 点序列统计
  mark,

  // 旧聚类 API 兼容导出
  scopeStart,
  scopeEnd,
  measureStart,
  measureEnd,

  // 录制窗口与 Reporter
  start,
  end,
  setReporter,
  clearReporter,
  createConsoleReporter,
  consoleReporter
} from '@mpxjs/perf'
```

`start/end` 是整个采集窗口的控制 API，不属于上述三类探针。

## 数据结构

### 聚类结果

现有聚合结果的字段结构保持不变，类型名统一调整为 `AggrResult`：

```ts
export interface AggrResult {
  count: number
  sum: number
  avg: number
  max: number
}
```

### 点序列

`MarkEvent` 统一调整时间字段：

```ts
export interface MarkEvent {
  name: string
  /** 相对当前录制窗口 start() 的毫秒偏移。 */
  start: number
  /** mark 发生时读取的原始时间戳。 */
  timestamp: number
  info?: unknown
}

export interface MarkTimeline {
  events: MarkEvent[]
  /** 达到容量上限后被丢弃的显式 mark 数量。 */
  dropped: number
}
```

内建窗口边界也使用同一结构：

- start 边界为 `{ name: 'start', start: 0, timestamp: startedAt }`。
- end 边界为 `{ name: 'end', start: endedAt - startedAt, timestamp: endedAt }`。

### 区段序列

```ts
export interface TraceEvent {
  name: string
  /** 相对当前录制窗口 start() 的毫秒偏移。 */
  start: number
  /** traceStart() 读取的原始开始时间戳。 */
  timestamp: number
  /** 区段持续时间，单位为 ms。 */
  duration: number
  /** traceEnd() 传入的用户自定义信息，按引用保存。 */
  info?: unknown
}

export interface TraceTimeline {
  /** 只包含已完成区段，顺序与 traceStart 调用顺序一致。 */
  events: TraceEvent[]
  /** 达到容量上限后被丢弃的 trace 数量。 */
  dropped: number
  /** 已成功 start、但窗口结束前未成功 end 的区段数量。 */
  incomplete: number
}
```

两类事件的时间字段使用同一个 `now()` 时钟源：

- `timestamp` 保存事件发生或区段开始时 `now()` 返回的原始值。
- `start = timestamp - recordingStart`，用于当前窗口内的相对定位。
- `timestamp` 不保证是 Unix epoch；当时钟源为 `performance.now()` 或 Hermes `nativePerformanceNow()` 时，它相对各自的 performance time origin。
- 同一个录制窗口及同一运行环境中的 timestamp 可以直接比较，也可以用于 Chrome Trace/Perfetto；跨设备或跨进程对齐不在本方案范围内。

`dropped` 只统计容量已满后被直接丢弃的 trace/mark 数量；这些数据不进入事件数组，也不保存时间与 info。`incomplete` 只统计已经占用 trace 序列位置、但没有形成完整持续时间的区段。

### Reporter

在现有两个参数后追加可选的第三参数：

```ts
export type Reporter = (
  aggregates: Map<string, AggrResult>,
  marks?: MarkTimeline,
  traces?: TraceTimeline
) => void
```

选择第三参数而不是整体改为对象入参，是为了兼容当前 Reporter：

- `(aggregates) => {}` 继续忽略后两个参数。
- `(aggregates, marks) => {}` 的第二参数语义保持不变。
- 新 Reporter 可读取第三个 `TraceTimeline`。
- 外部手动调用 Reporter 时仍可只传一个或两个参数。

通过正常 `start/end` 结束的窗口会始终传入 marks 与 traces；即使没有显式 trace，第三参数也是空的 `TraceTimeline`。

## 区段序列的顺序与容量

### start 顺序是权威顺序

嵌套调用的结束顺序与开始顺序相反：

```text
traceStart(A)
  traceStart(B)
  traceEnd(B)
traceEnd(A)
```

如果只在 `traceEnd` 时 push，序列会得到 `[B, A]`，不符合火焰图从父到子的阅读顺序。因此 trace 在 start 时预留事件槽位，在 end 时回填 `duration` 和 `info`：

1. `traceStart` 向当前 `TraceTimeline` 预留一个内部事件，记录 `name/start/timestamp`。
2. id 模式返回独立数字句柄；name 模式保存 `name → eventIndex`。
3. `traceEnd` 找到事件并回填 `duration/info`，重复 end 安全 noop。
4. 窗口结束时原地压缩未完成事件，Reporter 最终只看到完整 `TraceEvent`。

这样无需在 `end()` 时排序，低精度时钟下多个区段 `start/timestamp` 相同也不会丢失调用顺序。

### 独立有界序列

两类序列使用独立的窗口级容量，默认值均为 1024：

```ts
const DEFAULT_MARK_LIMIT = 1024
const DEFAULT_TRACE_LIMIT = 1024
```

- MarkTimeline 的 `markLimit` 包含 1 个 start 和 1 个 end；默认最多保存 1022 个显式 mark，总 events 长度不超过 1024。
- TraceTimeline 的 `traceLimit` 只计算 trace 区段；默认最多预留 1024 个区段，不额外写入 start/end 边界。
- 两类容量相互独立，mark 过多不会挤掉 trace，反之亦然。
- mark 达到上限后执行 `timeline.dropped++` 并直接 return，不保存新增事件。
- trace 达到上限后执行 `traceTimeline.dropped++` 并直接 return：id 模式返回 `-1`，name 模式不注册起点。
- 不使用 `shift` 或循环覆盖，始终保留窗口前缀，避免满容量后的线性移动成本。

`dropped` 是溢出后的唯一统计，不记录被丢弃事件的 name、时间或 info。自定义 Reporter 如果需要完整数据，应在 `start({ markLimit, traceLimit })` 时提高容量。

## 运行时实现

### 1. 聚类起点统一

`impl.ts` 将现有 scope 平行数组和 measure name Map 收敛到 `aggrStart/aggrEnd`：

```ts
const aggrNames: (string | null)[] = []
const aggrStarts: number[] = []
const aggrFreeList: number[] = []
const namedAggrStarts = new Map<string, number>()

export function aggrStart (name: string, useName = false): number | void {
  if (useName) {
    namedAggrStarts.set(name, now())
    return
  }
  if (!bus.isRecording()) return -1
  // 复用现有 scope 数组槽位逻辑。
}

export function aggrEnd (target: number | string): void {
  if (typeof target === 'string') {
    // 消费 namedAggrStarts，再调用 bus.pushAggr。
    return
  }
  // 消费数字槽位，再调用 bus.pushAggr。
}
```

实现时不需要为了统一 API 再抽象一层通用“计时器类”。id 与 name 两条分支继续直接操作各自最合适的数据结构，避免改变高频 id 路径的成本。

bus 内部的 `pushMeasure` 同步重命名为 `pushAggr`，现有聚合 Map 变量重命名为 `aggrMap`，聚类相关缩写统一使用 `aggr/Aggr`。

### 2. Trace 预留与完成

bus 新增两个内部方法：

```ts
bus.reserveTrace(name, startedAt): number
bus.finishTrace(eventIndex, endedAt, info?): void
```

`reserveTrace` 先检查 `traceTimeline.events.length >= traceLimit`；容量已满时只执行 `traceTimeline.dropped++` 并返回 `-1`，不创建事件或注册配对映射。容量未满时才预留内部槽位，并写入：

```ts
event.timestamp = startedAt
event.start = startedAt - recordingStart
```

`finishTrace` 只允许完成当前窗口中尚未结束的事件，使用 `endedAt - event.timestamp` 计算 duration。

`impl.ts` 维护配对索引：

```ts
let nextTraceId = 0
const traceIdToEvent = new Map<number, number>()
const traceNameToEvent = new Map<string, number>()
```

id 使用单调递增值，而不是直接暴露事件数组下标，窗口结束时清空映射。这样上一窗口未消费的旧 id 不会误结束下一窗口相同下标的新事件。name 模式直接保存 eventIndex，同名覆盖语义与聚类 name 模式一致。

窗口结束后清空两个进行中映射；未完成的内部事件由 bus 计入 `incomplete` 并从 Reporter 可见的 events 中移除。

### 3. Mark info

`pushMark` 增加 `info` 参数，在通过录制状态和容量检查后才创建事件对象：

```ts
bus.pushMark(name, now(), info)
```

bus 将第二个参数同时保存为 `event.timestamp`，并计算 `event.start = event.timestamp - recordingStart`。

`pushMark` 在 `timeline.events.length >= markLimit - 1` 时只执行 `timeline.dropped++` 并直接 return，始终为 end 边界预留最后一个位置。

`info` 直接按引用保存：

- 不做浅拷贝或深拷贝，避免额外开销。
- Reporter 执行前调用方若修改该对象，看到的是修改后的内容。
- 循环引用、不可序列化值或大对象由调用方负责。
- 默认 console Reporter 的 info 格式化失败不能影响业务或其他统计输出。

### 4. 录制窗口

`impl.start(options?)` 读取当前时间并调用 `bus.start(startedAt, options)`。bus 在真正创建窗口时归一化 `markLimit/traceLimit`，无效值回退到默认值 1024，然后新建三个窗口容器：

1. `Map<string, AggrResult>`。
2. 带 start 边界的 `MarkTimeline`。
3. 空的 `TraceTimeline`。

`bus.end(endedAt, reporter?)` 的顺序为：

1. 写入带 `start/timestamp` 的 MarkTimeline end 边界。
2. 关闭录制状态。
3. 回填聚类结果的 `avg`。
4. 原地移除未完成 trace，并计算 `incomplete`。
5. 依次调用全局 Reporter 和局部 Reporter，传入同一份 aggregates、marks、traces 引用。

重复 start 继续幂等，传入的新 options 也被忽略；未 start 或重复 end 继续 noop。TraceTimeline 与 MarkTimeline 共用同一个 `recordingStart`，两者时间坐标可直接关联。

### 5. 导出、noop 与 DCE

`index.ts` 继续为每个新 API 使用独立顶层三元：

```ts
export const aggrStart = __mpx_perf__ ? impl.aggrStart : noop.aggrStart
export const aggrEnd = __mpx_perf__ ? impl.aggrEnd : noop.aggrEnd
export const traceStart = __mpx_perf__ ? impl.traceStart : noop.traceStart
export const traceEnd = __mpx_perf__ ? impl.traceEnd : noop.traceEnd
export const mark = __mpx_perf__ ? impl.mark : noop.mark
```

`noop.ts` 提供相同签名的空实现，包括 `start(_options?)`；id 模式的探针 start 恒返回 `-1`。旧 API 兼容包装也分别从 impl/noop 导出，不能在 `index.ts` 中创建会让 impl 保持活引用的新闭包。

调用方仍必须直接使用字面量门禁：

```ts
if (__mpx_perf_user__) {
  const id = traceStart('module:goods')
  // ...
  traceEnd(id)
}
```

框架现有 `scopeStart/scopeEnd` 点位无需立即迁移，关闭态 DCE 链路也不需要修改 webpack-plugin。

## 旧 API 兼容

四个旧导出保持原函数签名，由 impl 中的薄包装调用新聚类 API：

```ts
export function scopeStart (name: string): number {
  return aggrStart(name)
}

export function scopeEnd (id: number): void {
  aggrEnd(id)
}

export function measureStart (name: string): void {
  aggrStart(name, true)
}

export function measureEnd (name: string): void {
  aggrEnd(name)
}
```

兼容关系：

| 旧 API | 内部映射 | 兼容语义 |
| --- | --- | --- |
| `scopeStart(name)` | `aggrStart(name)` | 返回 id；未录制返回 `-1` |
| `scopeEnd(id)` | `aggrEnd(id)` | 负 id 和重复 end 均 noop |
| `measureStart(name)` | `aggrStart(name, true)` | 同名 start 后一次覆盖前一次 |
| `measureEnd(name)` | `aggrEnd(name)` | 命中后消费起点，重复 end noop |

旧 API 在类型与文档中标记为兼容 API，但本次不设置移除版本。仓库内已有框架探针可以保持不变；新接入和新文档优先使用 `aggrStart/aggrEnd`。

Reporter 的第三参数和 `MarkEvent.info/timestamp` 是加法扩展；`MarkEvent.at` 则直接重命名为 `start`。已有一、二参数 Reporter 的函数签名保持兼容，但读取点序列时间的代码需要从 `event.at` 迁移为 `event.start`。

聚合结果类型同步统一为 `AggrResult`，不保留旧类型别名；使用方若显式导入旧类型，需要同步修改类型导入。旧函数 API 的运行时兼容与该类型命名迁移相互独立。

## Console Reporter

`createConsoleReporter` 调整为三个独立区块：

```text
[mpx perf] 2 aggregate buckets / 3 traces / 4 marks
aggregates
name                  count      sum      avg      max
--------------------  -----  -------  -------  -------
view:render:total         12  18.20ms   1.52ms   3.42ms

traces
index    start  timestamp  duration  name             info
-----  -------  ---------  --------  ---------------  -----------------
    0   1.20ms  1001.20ms    8.70ms  module:app       {"moduleId":1}
    1   2.10ms  1002.10ms    3.40ms  module:router    {"moduleId":42}

marks
index    start  timestamp  name                info
-----  -------  ---------  ------------------  --------------------
    0   0.00ms  1000.00ms  start
    1  10.20ms  1010.20ms  goods:data-ready    {"source":"cache"}
    2  12.00ms  1012.00ms  end
```

规则如下：

- `sortBy` 只影响 aggregates。
- `filter` 同时作用于 aggregate、trace 和显式 mark 名称，仍不隐藏内建 start/end。
- trace 与 mark 均保持原始顺序，不按名称或耗时排序。
- 仅当对应数据非空时输出 aggregates/traces 区块；marks 始终至少包含 start/end。
- 仅在至少一项存在 info 时显示 info 列。
- `info` 优先 `JSON.stringify`，失败时回退为安全字符串，不能让默认 Reporter 整体中断。
- 分别提示 mark `dropped`、trace `dropped` 和 trace `incomplete`。

## 火焰图与 Chrome Trace 对接

`TraceEvent` 可以无损映射为 Chrome Trace Event Format 的 Complete Event：

| TraceEvent | Chrome Trace |
| --- | --- |
| `name` | `name` |
| `timestamp * 1000` | `ts`，单位转换为 µs |
| `duration * 1000` | `dur`，单位转换为 µs |
| 固定值 | `ph: 'X'` |
| `info` | `args` |

MarkEvent 使用相同的 `timestamp * 1000` 映射为 Instant Event（`ph: 'i'`）；`start` 保留为窗口内相对位置，可用于单窗口 console 或 APM 展示。首期不把转换器和文件写入逻辑放入核心包：

- RN、Node 和浏览器的文件输出能力不同，核心包不应引入平台依赖。
- 业务 Reporter 通常还需要补充 `pid/tid/cat` 等业务字段。
- 保留原始毫秒时间线可以同时服务 console、APM、Chrome Trace 和 Perfetto。

后续若出现多处重复转换，再独立增加纯函数 Reporter/helper，不在本次提前抽象。

## 性能与内存

| 能力 | 未录制 | 录制中 |
| --- | --- | --- |
| aggr id 模式 | 状态判断后返回 `-1` | 延续数组槽位 + freeList；稳态零对象、零闭包分配 |
| aggr name 模式 | 延续现有 Map 起点语义 | 一次 Map set/get/delete；最终只保留聚合桶 |
| trace | 状态判断后 noop | 每个被接受区段一个内部事件对象和一条进行中映射，默认最多 1024 条 |
| mark | 状态判断后 noop | 每个显式 mark 一个事件对象，默认最多 1022 条，加 start/end 后总量最多 1024 |

`info` 只保存引用，其实际对象大小不受 Perf 控制。文档应明确建议只传递小型、可序列化的诊断字段，不要传组件实例、完整 props、响应体或大数组。

聚类 API 仍是高频路径首选。Trace/mark 需要保留逐次事件，只适用于诊断窗口和有限插桩点，不能替换 render 循环中的聚类统计。

## 变更范围

### 实现阶段

- `packages/perf/src/types.ts`
  - 现有聚合结果类型直接重命名为 `AggrResult`。
  - `MarkEvent.at` 重命名为 `start`，并新增 `timestamp/info`。
  - 新增 `TraceEvent/TraceTimeline`。
  - 新增 `PerfStartOptions`。
  - Reporter 增加可选第三参数。
- `packages/perf/src/bus.ts`
  - `pushMeasure` 重命名为 `pushAggr`，现有聚合 Map 变量重命名为 `aggrMap`。
  - 增加 TraceTimeline、trace 预留/完成/压缩，以及默认 1024、可覆盖的独立序列容量。
  - `pushMark` 接收 info。
- `packages/perf/src/impl.ts`
  - 新增统一的 `aggrStart/aggrEnd`。
  - 新增 `traceStart/traceEnd`。
  - `start(options?)` 将窗口容量配置传入 bus。
  - 将四个旧 API 改为薄兼容包装。
- `packages/perf/src/noop.ts`
  - 对齐新 API 和 Reporter 签名。
- `packages/perf/src/index.ts`
  - 用现有顶层三元导出新 API 与类型。
- `packages/perf/src/reporters/console.ts`
  - 输出 aggregates、traces、marks 与 info/截断信息。

不需要修改 webpack-plugin 的 perf 配置、DefinePlugin 常量或现有框架探针调用点。

### 实现时必须同步的文档与 Skill

- `packages/perf/README.md`
  - 三类能力、配对模式、窗口容量配置、info、Reporter、类型重命名和 profile 对接示例。
- `docs-vitepress/guide/advance/perf.md`
  - 新 API 参考、旧 API 兼容说明、TraceTimeline 与火焰图用法。
- `packages/perf/AGENTS.md`
  - 更新导出面、核心模块、调用链与性能约束。
- `.agents/skills/mpx2rn/references/rn-script-reference.md`
  - 同步 Mpx2RN Perf API 和序列能力。

本方案文件本身不改变用户 API，因此本轮不修改上述文档与 Skill；实际实现必须在同一次变更中完成同步。

## 测试方案

### 聚类 API

1. id 模式生成正确的 count/sum/avg/max。
2. id 模式支持嵌套、乱序结束和同名并发。
3. name 模式使用 name 配对，同名 start 后一次覆盖前一次。
4. `aggrEnd` 对负 id、缺失 name、重复 end 安全 noop。
5. id 模式未录制时返回 `-1` 且不读取时钟。
6. `scope*` 与 `measure*` 的结果和现有行为一致，并验证它们调用统一聚类实现。

### TraceTimeline

1. id 与 name 两种模式均可完成区段。
2. 嵌套区段按 start 顺序输出，而不是 end 顺序。
3. `start` 等于 `timestamp - recordingStart`，`duration` 基于同一时钟计算正确。
4. `traceEnd` 保存 info 引用；不传 info 时保持可选。
5. 同一个 id/name 重复 end 只完成一次。
6. 未录制时 trace 不读取时钟、不分配事件，id 模式返回 `-1`。
7. 窗口结束前未 end 的区段不进入 events，并准确增加 `incomplete`。
8. name 模式覆盖和窗口结束清理不会污染下一窗口。
9. 默认容量为 1024；第 1025 个 trace 只增加 `dropped`，id 模式返回 `-1`，且 events 不超过 1024。
10. `start({ traceLimit })` 可覆盖当前窗口容量，传 `0` 时所有 trace 均被丢弃并累计 dropped。
11. 上一窗口遗留 id 不能结束下一窗口的新事件。

### MarkTimeline

1. `mark(name, info)` 将 info 保存到对应事件。
2. 每个 mark 的 `start` 等于 `timestamp - recordingStart`。
3. 同名 mark 继续保序且不合并。
4. start/end 边界具有正确的 `start/timestamp`，且不携带 info。
5. 默认总容量为 1024：保留 start、前 1022 个显式 mark 和 end，后续 mark 只增加 dropped。
6. `start({ markLimit })` 可覆盖当前窗口容量，并始终为 end 预留最后一个位置。

### Reporter 与 Console

1. 一参数、二参数旧 Reporter 继续通过类型检查并正常运行。
2. 全局与局部 Reporter 收到同一份 aggregates、marks、traces 引用。
3. trace/mark 的 start、timestamp、顺序、filter、info 和三类截断提示正确。
4. info 含循环引用或 stringify 抛错时 console Reporter 不影响业务。
5. 未传第三参数手动调用 console Reporter 时保持兼容输出。

### 录制窗口配置

1. `start()` 默认使用 `markLimit: 1024` 与 `traceLimit: 1024`。
2. `start({ markLimit, traceLimit })` 分别覆盖两类序列容量。
3. 录制中重复 `start(options)` 保持幂等，不修改当前窗口容量。
4. 无效配置回退到对应默认值。
5. 新窗口重新读取配置，不继承上一窗口的自定义容量。

### 构建与 DCE

1. `perf.enable: false` 时产物不包含新 API 实现、事件名或 TraceTimeline 字符串。
2. 对应 probe 分组关闭时，调用方 trace/mark/aggr 代码和名称字面量被移除。
3. `dist/index.js` 继续保留顶层三元结构，TypeScript 声明包含 overload 与新类型。
4. 声明文件导出 `AggrResult` 且不再导出旧聚合结果类型。
5. 聚类 id 路径没有新增事件对象或闭包分配。

实现完成后执行：

```sh
npx eslint --ext .ts packages/perf/src packages/perf/__tests__
npm run test -w @mpxjs/perf -- --runInBand
npm run build -w @mpxjs/perf
npm run docs:build
git diff --check
```

## 验收标准

1. Perf 对外明确提供 `aggr*`、`trace*`、`mark` 三类探针 API。
2. `aggrEnd` 与 `traceEnd` 均可接收数字 id 或字符串 name。
3. `aggrStart/traceStart` 默认返回 id，传 `useName: true` 时使用 name 配对。
4. `traceEnd` 与 `mark` 的 info 在 Reporter 中可读取，且核心采集层不复制或序列化它。
5. 嵌套 trace 在 Reporter 中保持 start 顺序，并能依赖 `start/timestamp/duration` 还原火焰图。
6. 未完成、容量丢弃和正常完成的 trace 可被明确区分。
7. 四个旧聚类 API 保持导出和原签名，内部只复用新的聚类实现，不维护第二套状态。
8. 聚类相关缩写统一为 `aggr/Aggr`，包括 `AggrResult`、`aggrMap` 与内部方法/变量；不再混用其他缩写前缀。
9. 现有一、二参数 Reporter 函数签名保持兼容；MarkTimeline 消费代码按要求由 `at` 迁移到 `start`。
10. 聚类 id 热路径成本不回退；mark 与 trace 使用独立、默认 1024 且可由 `start(options)` 覆盖的窗口上限。
11. 超出容量的数据只增加对应 dropped，随后直接 return，不保存事件、时间、name 或 info。
12. 关闭态产物继续保持探针实现、依赖和名称字符串零残留。
13. 实现、测试、README、正式文档、AGENTS 与 Mpx2RN Skill 在同一次代码变更中同步完成。

## 方案取舍

### 为什么使用 `aggr`

这类 API 不保留每次区段，只把同名样本合并到一个桶。`aggr` 保留了 aggregate 的主要词干，比过度缩写更容易辨认，又明显短于完整的 `aggregate`；相比 `scope` 和 `measure`，它也能直接表达聚合输出。

### 为什么使用 `trace` 而不是 `profile`

本能力通过显式 start/end 产生区段时间线，不是采样型 profiler。`trace` 与 Chrome Trace/Perfetto 的 Complete Event 语义一致，也能自然覆盖火焰图、瀑布图和普通区段列表。`profileStart/profileEnd` 容易让使用者误以为它控制整个 profiler，与现有录制窗口 `start/end` 的职责重叠。

### 为什么保留 id 与 name 两种模式

id 模式支持同名并发、递归和嵌套，并保留高频同步路径的最低开销；name 模式便于跨作用域传递。统一成一组 API 可以消除重复命名，但不能用 name 模式替代 id 模式，否则会破坏现有 scope 的并发语义。

### 为什么 Reporter 继续使用位置参数

把 Reporter 改成 `reporter({ aggregates, traces, marks })` 更整齐，但会直接破坏所有现有 Reporter。追加可选第三参数虽然不如对象参数易扩展，但本次只新增一种输出，兼容收益更高。若未来继续增加第四类输出，再单独设计 Reporter v2，而不是提前制造 breaking change。
