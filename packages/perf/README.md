# @mpxjs/perf

Mpx2RN 运行时按需性能探针，提供区段聚类统计、区段序列统计和点序列统计。

## 设计原则

`@mpxjs/perf` 使用「编译期常量开关 + 运行时探针实现 + tree-shaking 兜底」。关闭态下，探针实现、名称字符串和模块依赖都不会进入最终产物。

| 统计类型 | API | 输出 | 典型用途 |
| --- | --- | --- | --- |
| 区段聚类统计 | `aggrStart` / `aggrEnd` | `Map<string, AggrResult>` | 高频 render、hook、函数的 count/sum/avg/max |
| 区段序列统计 | `traceStart` / `traceEnd` | `TraceTimeline` | 模块火焰图、嵌套调用 profile、异步瀑布图 |
| 点序列统计 | `mark` | `MarkTimeline` | 数据就绪、首次渲染、页面可交互等里程碑 |

聚类统计不保留逐次样本，适合高频路径；trace 和 mark 会保留事件对象，只用于有限插桩点和诊断窗口。

## API

```ts
import {
  aggrStart, aggrEnd,
  traceStart, traceEnd,
  mark,
  scopeStart, scopeEnd,
  measureStart, measureEnd,
  start, end,
  setReporter, clearReporter,
  createConsoleReporter, consoleReporter
} from '@mpxjs/perf'
```

| API | 说明 |
| --- | --- |
| `aggrStart(name, useName?)` | 默认返回数字 id；传 `true` 时改用 name 配对且不返回 id。id 模式未录制时返回 `-1`。 |
| `aggrEnd(idOrName)` | 结束聚合区段并写入同名桶；无效目标和重复结束安全 noop。 |
| `traceStart(name, useName?)` | 默认返回数字 id；传 `true` 时改用 name 配对。必须在录制窗口中 start。 |
| `traceEnd(idOrName, info?)` | 结束 trace，保存持续时长与可选 info。 |
| `mark(name, info?)` | 保存独立、有序的点事件与可选 info。 |
| `start(options?)` | 打开录制窗口；可配置 `markLimit` / `traceLimit`。重复 start 幂等。 |
| `end(reporter?)` | 关闭窗口并同步触发全局及可选局部 reporter。 |
| `setReporter(r)` / `clearReporter()` | 替换或清空全局 reporter。 |
| `createConsoleReporter(opts?)` | 创建可配置的 console reporter。 |
| `consoleReporter` | 默认 reporter，等价于 `createConsoleReporter()`。 |

`scopeStart/scopeEnd` 与 `measureStart/measureEnd` 保持兼容导出，内部只调用 `aggrStart/aggrEnd`。新代码优先使用 `aggr*`。

## 接入

### mpx.config.js

```js
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  pluginOptions: {
    mpx: {
      plugin: {
        perf: {
          enable: !!process.env.MPX_PERF,
          probes: ['framework', 'user']
        }
      }
    }
  }
})
```

### 录制窗口

```ts
import { start, end } from '@mpxjs/perf'

if (__mpx_perf__) {
  start({
    markLimit: 2048,
    traceLimit: 4096
  })
}

// 执行业务流程

if (__mpx_perf__) end()
```

两类序列默认容量均为 1024：

- `markLimit` 包含 start/end 边界，必须是不小于 2 的整数。
- `traceLimit` 只计算 trace，必须是非负整数；传 `0` 可关闭当前窗口的 trace 存储。
- 无效配置回退到 1024。
- 录制中重复调用 `start(options)` 不清空数据，也不修改当前窗口容量。

### 区段聚类统计

同步高频路径使用默认 id 模式：

```ts
import { aggrStart, aggrEnd } from '@mpxjs/perf'

function expensiveCompute (data) {
  let id = -1
  if (__mpx_perf_user__) id = aggrStart('myBiz:list:filter')
  const result = data.filter(/* ... */).sort(/* ... */)
  if (__mpx_perf_user__) aggrEnd(id)
  return result
}
```

跨作用域时显式使用 name 模式：

```ts
if (__mpx_perf_user__) aggrStart('goods:request', true)

loadPageData().finally(() => {
  if (__mpx_perf_user__) aggrEnd('goods:request')
})
```

id 模式支持嵌套、乱序结束和同名并发。name 模式中，后一次同名 start 会覆盖前一次起点。

### 区段序列统计

```ts
import { traceStart, traceEnd } from '@mpxjs/perf'

let appId = -1
let routerId = -1
if (__mpx_perf_user__) {
  appId = traceStart('module:app')
  routerId = traceStart('module:router')
}

if (__mpx_perf_user__) {
  traceEnd(routerId, { moduleId: 42 })
  traceEnd(appId, { moduleId: 1 })
}
```

trace 在 start 时预留位置，因此嵌套区段按 start 顺序输出。未完成区段不会进入 `events`，数量记录在 `incomplete`。name 模式适合不方便传递 id 的跨作用域区段；同名并发、递归和嵌套必须使用 id 模式。

### 点序列统计

```ts
import { mark } from '@mpxjs/perf'

if (__mpx_perf_user__) {
  mark('goods:data-ready', {
    source: 'cache',
    itemCount: 20
  })
}
```

同名 mark 不合并。`info` 按引用保存，不复制、不校验、不序列化；建议只传小型、可序列化的诊断字段，不要传组件实例、完整 props、响应体或大数组。

## 数据与 Reporter

```ts
interface AggrResult {
  count: number
  sum: number
  avg: number
  max: number
}

interface MarkEvent {
  name: string
  start: number
  timestamp: number
  info?: unknown
}

interface TraceEvent {
  name: string
  start: number
  timestamp: number
  duration: number
  info?: unknown
}

type Reporter = (
  aggregates: Map<string, AggrResult>,
  marks?: MarkTimeline,
  traces?: TraceTimeline
) => void
```

`start` 是相对当前录制窗口起点的毫秒偏移，`timestamp` 是同一时钟源返回的原始值。它不保证是 Unix epoch，但同一运行环境和录制窗口内可以直接比较。

通过正常 `start/end` 结束的窗口始终传入 marks 和 traces。参数保持可选，以兼容外部手动调用及旧的一、二参数 Reporter。全局和局部 Reporter 收到同一份 Map、marks 和 traces 引用，不要直接修改。

```ts
import { setReporter } from '@mpxjs/perf'
import type {
  AggrResult,
  MarkTimeline,
  TraceTimeline
} from '@mpxjs/perf'

if (__mpx_perf__) {
  setReporter((
    aggregates: Map<string, AggrResult>,
    marks?: MarkTimeline,
    traces?: TraceTimeline
  ) => {
    MyAPM.report({ aggregates, marks, traces })
  })
}
```

`TraceEvent` 可转换为 Chrome Trace Complete Event：

```ts
const chromeEvents = traces.events.map(event => ({
  name: event.name,
  ph: 'X',
  ts: event.timestamp * 1000,
  dur: event.duration * 1000,
  args: event.info
}))
```

核心包不内置文件写入或 Chrome Trace 转换器，业务 Reporter 可自行补充 `pid` / `tid` / `cat` 等字段。

## Console Reporter

`createConsoleReporter({ sortBy, filter, header })` 分别输出 aggregates、traces 和 marks：

- `sortBy` 只影响 aggregates。
- `filter` 同时作用于 aggregate、trace 和显式 mark，内建 start/end 不会被隐藏。
- trace 与 mark 保持原始顺序。
- 仅有事件包含 info 时才显示 info 列。
- mark dropped、trace dropped 和 trace incomplete 会分别提示。
- info 序列化失败不会中断业务或其他统计输出。

## 性能与 DCE

- `aggr` id 模式沿用数组槽位和 free list；录制稳态零对象、零闭包分配。
- `aggr` name 模式使用 `Map<string, number>` 保存起点。
- trace 每个被接受区段分配一个内部事件对象和一条进行中映射。
- mark 每个被接受事件分配一个小对象；mark 和 trace 容量相互独立。
- 超出容量的数据只增加对应 `dropped`，不会保存 name、时间或 info。

最终构建依赖 `dist/index.js` 中的顶层 `__mpx_perf__ ? impl.x : noop.x` 三元、`sideEffects: false` 和使用方 Terser 完成 DCE。所有探针调用必须直接放在 `if (__mpx_perf_user__)` / `if (__mpx_perf_framework__)` 字面量条件内。

`AggrResult` 是聚合结果的新类型名，不再导出旧 `AggResult`；显式类型导入需同步迁移。`MarkEvent.at` 已更名为 `start`，并增加 `timestamp` / `info`。
