# 跨端运行时按需测速 {#runtime-perf-probe}

Mpx 在小程序、Web、React Native 上都有实例初始化、模板执行、生命周期和卸载等框架热路径，平台 Profiler 难以直接表达 Mpx 自身的语义阶段。`@mpxjs/perf` 提供跨端共用、可按构建关闭且关闭态零残留的显式性能探针。

## 三类统计能力 {#statistics}

| 统计类型 | API | 输出 | 典型用途 |
| --- | --- | --- | --- |
| 区段聚类统计 | `aggrStart` / `aggrEnd` | `Map<string, AggrResult>` | 高频 render、hook、函数的 count/sum/avg/max |
| 区段序列统计 | `traceStart` / `traceEnd` | `TraceTimeline` | 模块火焰图、嵌套调用 profile、异步区段瀑布图 |
| 点序列统计 | `mark` | `MarkTimeline` | 数据就绪、首次渲染、页面可交互等里程碑 |

`start/end` 控制整个录制窗口，Reporter 在窗口结束时同步收到三类结果。聚类统计不保留逐次样本，适合高频热路径；trace 和 mark 会保留事件对象，只适合有限插桩点和诊断窗口。

## 设计原则 {#design-principles}

`@mpxjs/perf` 采用「编译期常量开关 + 运行时探针实现 + tree-shaking 兜底」三层结构：

1. `MpxWebpackPlugin` 通过 `DefinePlugin` 注入 `__mpx_perf__` 和分组常量。
2. 探针调用直接包在 `if (__mpx_perf_framework__)` / `if (__mpx_perf_user__)` 字面量条件里。
3. Terser 消除关闭分组的调用点，webpack tree-shaking 继续剔除失活的实现模块。

关闭态产物中不会保留探针实现、名称字符串或模块依赖。

::: warning 该方案不支持线上动态开关
线上开关意味着探针字节必须进入产物，与关闭态零残留目标冲突。线上诊断需重新构建一个开启探针的内测包。
:::

## 配置入口 {#config}

在 `mpx.config.js` 的 `pluginOptions.mpx.plugin` 下配置 `perf`：

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

### 配置项说明 {#config-options}

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `enable` | `boolean` | 总开关。`false` 或不传时整套探针关闭。 |
| `probes` | `string[]` | 当前支持 `'framework'` / `'user'`。空数组等价于关闭，未知分组会在编译期报错。 |

| 分组 | 控制对象 | 典型用途 |
| --- | --- | --- |
| `framework` | 框架内建探针，如 `instance:*` / `scheduler:*` / `lifecycle:*` / 基础组件 render | 调试 Mpx 框架自身热路径 |
| `user` | 业务自定义探针 | 定位业务流程和函数耗时 |

两个分组独立 DCE，但共享同一个录制窗口和 Reporter。

## 录制窗口 {#recording-window}

```ts
import { start, end } from '@mpxjs/perf'

router.beforeEnter('/goods/:id', () => {
  if (__mpx_perf__) {
    start({
      markLimit: 2048,
      traceLimit: 4096
    })
  }
})

router.beforeLeave('/goods/:id', () => {
  if (__mpx_perf__) end()
})
```

```ts
interface PerfStartOptions {
  markLimit?: number
  traceLimit?: number
}
```

- `markLimit` 是 `MarkTimeline` 的总事件上限，包含 start/end 边界，默认 1024，必须是不小于 2 的整数。
- `traceLimit` 是 trace 区段上限，默认 1024，必须是非负整数；传 `0` 可关闭当前窗口的 trace 存储。
- 无效值回退为 1024。
- 录制中重复调用 `start(options)` 保持幂等，不清空数据，也不修改当前容量。
- 新窗口重新读取配置，不继承上一窗口的自定义容量。

`start()` 自动生成 `{ name: 'start', start: 0, timestamp: startedAt }`，`end()` 自动生成同结构的 end 边界。即使没有显式探针，完整窗口也会触发 Reporter。

## 区段聚类统计 {#aggregate}

聚类 API 将同名样本实时合并为 `{ count, sum, avg, max }`，不保存逐次耗时。

### id 模式 {#aggregate-id}

默认 id 模式支持嵌套、乱序结束和同名并发，也是同步高频路径的首选：

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

未录制时 `aggrStart(name)` 返回 `-1` 且不读取时钟。录制中使用数组槽位和 free list，稳态零对象、零闭包分配。

### name 模式 {#aggregate-name}

开始和结束不方便传递 id 时，显式传入 `useName: true`：

```ts
if (__mpx_perf_user__) aggrStart('goods:request', true)

loadPageData().finally(() => {
  if (__mpx_perf_user__) aggrEnd('goods:request')
})
```

name 模式允许在录制窗口外保存起点，只有 `aggrEnd(name)` 发生在录制中时样本才会进入结果。后一次同名 start 会覆盖前一次起点，同名并发必须改用 id 模式。

## 区段序列统计 {#trace}

trace 保存每次区段的开始位置和持续时长，可还原模块火焰图或异步瀑布图：

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

trace 在 start 时预留事件位置，在 end 时回填 `duration` / `info`，因此嵌套区段始终按 start 顺序输出。未完成区段在窗口结束时从 `events` 移除，并计入 `incomplete`。

跨作用域且不方便传递 id 时可以使用 name 模式：

```ts
if (__mpx_perf_user__) traceStart('request:goods', true)

loadPageData().finally(() => {
  if (__mpx_perf_user__) {
    traceEnd('request:goods', { status: 'fulfilled' })
  }
})
```

trace 必须在录制窗口中 start。name 模式同名覆盖时，被覆盖的旧区段会计入 `incomplete`；同名并发、递归和严格嵌套必须使用 id 模式。上一窗口未消费的旧 id 不能结束下一窗口的新事件。

## 点序列统计 {#mark}

`mark(name, info?)` 记录瞬时里程碑，不产生聚合桶：

```ts
import { mark } from '@mpxjs/perf'

if (__mpx_perf_user__) {
  mark('goods:data-ready', {
    source: 'cache',
    itemCount: 20
  })
}
```

同名 mark 仍是多条独立事件。`info` 按引用保存，不复制、不校验、不序列化；建议只传小型、可序列化的诊断字段，不要传组件实例、完整 props、响应体或大数组。

## 数据结构 {#data-types}

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

interface MarkTimeline {
  events: MarkEvent[]
  dropped: number
}

interface TraceEvent {
  name: string
  start: number
  timestamp: number
  duration: number
  info?: unknown
}

interface TraceTimeline {
  events: TraceEvent[]
  dropped: number
  incomplete: number
}
```

`start` 是相对当前录制窗口起点的毫秒偏移。`timestamp` 是 `performance.now()`、Hermes `nativePerformanceNow()` 或 `Date.now()` 返回的原始值，不保证是 Unix epoch；同一运行环境和窗口中的值可以直接比较。

mark 和 trace 使用独立容量。达到上限后只增加对应 `dropped`，不保存事件、时间、name 或 info。mark 始终为 end 边界预留最后一个位置。

## Reporter {#reporter}

```ts
type Reporter = (
  aggregates: Map<string, AggrResult>,
  marks?: MarkTimeline,
  traces?: TraceTimeline
) => void
```

通过正常 `start/end` 完成的窗口始终传入 marks 和 traces；后两个参数保持可选，兼容旧的一、二参数 Reporter 和外部手动调用。

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
    MyAPM.report('mpx_perf_aggregates', aggregates)
    if (marks) MyAPM.report('mpx_perf_marks', marks)
    if (traces) MyAPM.report('mpx_perf_traces', traces)
  })
}
```

全局 Reporter 和 `end(localReporter)` 传入的局部 Reporter 会依次收到同一份 Map、marks 和 traces 引用。不要直接修改；需要改写时自行复制。

::: warning 注册时机
`setReporter` 必须直接放在 `if (__mpx_perf__)` 中，确保自定义函数和闭包也能在关闭态被 DCE。
:::

### Console Reporter {#console-reporter}

默认 `consoleReporter` 分别输出 aggregates、traces 和 marks。`createConsoleReporter({ sortBy, filter, header })` 可定制：

- `sortBy` 只影响 aggregates。
- `filter` 同时作用于 aggregate、trace 和显式 mark，内建 start/end 不会隐藏。
- trace 和 mark 保持原始顺序。
- 仅有事件包含 info 时显示 info 列。
- mark dropped、trace dropped 和 trace incomplete 分别提示。
- info 的 JSON 格式化失败不会中断业务或其他统计输出。

### Chrome Trace 对接 {#chrome-trace}

`TraceEvent` 可映射为 Chrome Trace / Perfetto Complete Event：

```ts
const chromeEvents = traces.events.map(event => ({
  name: event.name,
  ph: 'X',
  ts: event.timestamp * 1000,
  dur: event.duration * 1000,
  args: event.info
}))
```

核心包不内置文件写入或格式转换器，业务 Reporter 可按需补充 `pid` / `tid` / `cat` 等字段。MarkEvent 可用同一 `timestamp * 1000` 规则映射为 Instant Event。

## API 参考 {#api}

| API | 说明 |
| --- | --- |
| `aggrStart(name, useName?)` | 默认返回数字 id；传 `true` 改用 name 配对。 |
| `aggrEnd(idOrName)` | 完成区段并实时聚合；无效或重复目标安全 noop。 |
| `traceStart(name, useName?)` | 默认返回数字 id；传 `true` 改用 name 配对。 |
| `traceEnd(idOrName, info?)` | 完成 trace 并保存可选 info。 |
| `mark(name, info?)` | 追加独立、有序的点事件。 |
| `start(options?)` | 创建录制窗口和三类容器；重复 start 幂等。 |
| `end(reporter?)` | 关闭窗口，回填 avg、压缩未完成 trace 并触发 Reporter。 |
| `setReporter(r)` / `clearReporter()` | 替换或清空全局 Reporter。 |
| `createConsoleReporter(opts?)` | 创建可配置的 Console Reporter。 |
| `consoleReporter` | 默认 Reporter。 |

### 旧 API 兼容 {#legacy-api}

| 旧 API | 内部映射 | 兼容语义 |
| --- | --- | --- |
| `scopeStart(name)` | `aggrStart(name)` | 返回 id；未录制返回 `-1`。 |
| `scopeEnd(id)` | `aggrEnd(id)` | 负 id 和重复结束安全 noop。 |
| `measureStart(name)` | `aggrStart(name, true)` | 后一次同名 start 覆盖前一次。 |
| `measureEnd(name)` | `aggrEnd(name)` | 命中后消费起点。 |

四个旧函数继续导出且没有移除版本，但新代码优先使用 `aggrStart/aggrEnd`。聚合结果类型已由 `AggResult` 更名为 `AggrResult`，不保留旧类型别名；`MarkEvent.at` 已更名为 `start`，并新增 `timestamp` / `info`。

## 内置框架探针事件 schema {#schema}

统一指标只描述 Mpx 语义，不使用 `mini:`、`web:`、`rn:` 平台前缀。Reporter 应结合 `__mpx_mode__` 分平台建立基线；不同平台缺少某个阶段时不会产生该指标。现有框架探针继续通过兼容的 `scopeStart/scopeEnd` 采集聚合耗时。

### 实例、调度与生命周期 {#schema-instance}

| 指标 | 小程序 | Web | RN | 边界 |
| --- | --- | --- | --- | --- |
| `instance:init` | 是 | 是 | 是 | `beforeCreate` 完成后到 `created` 开始前的实例 state 初始化 |
| `instance:init:setup` | 是 | 是 | 是 | 用户 `setup(props, context)` 同步调用 |
| `instance:render` | 是 | 是 | 是 | 平台 render 同步执行；小程序覆盖非 vnode `ReactiveEffect` 主函数，Web 覆盖 Mpx 实例的 Vue `_render`；均从进入到正常返回 |
| `instance:render:getStyle` | 否 | 否 | 是 | RN `__getStyle` 同步执行 |
| `instance:render:getStyle:class` | 否 | 否 | 是 | RN class 样式解析 |
| `instance:render:getStyle:style` | 否 | 否 | 是 | RN inline style 解析 |
| `instance:unmount` | 是 | 是 | 是 | 前置卸载 hook 完成后的实例核心资源释放 |
| `scheduler:flush` | 是 | 否 | 是 | 一次 Mpx scheduler 完整 drain，递归新增任务不重复计样本 |
| `lifecycle:<hook>` | 按支持情况 | 按支持情况 | 按支持情况 | 存在真实 option hook 或组合式 hook 时的一次 Page / Component 生命周期调度 |
| `lifecycle:app:<hook>` | 按支持情况 | 按支持情况 | 按支持情况 | 一次用户定义的 App 生命周期执行，含用户 mixin、不含内建 mixin |

不采集宿主 `setData` 调用到 callback 的异步耗时，该阶段受宿主调度影响。这些指标存在包含关系，不能直接相加。例如 `instance:init:setup` 是 `instance:init` 的子阶段，RN 的 `instance:render:getStyle` 及其 class/style 子阶段包含在 `instance:render` 中。

内建低频 mark 节点为：

```text
app:onLaunch:start
page:onLoad:start
page:onReady:start
```

三个节点都在对应生命周期开始前产生。`page:onLoad:start` 和 `page:onReady:start` 的 `info` 均为 `{ route }`，用于标识当前页面。`page:onReady:start` 只表示目标平台开始调度 Mpx `onReady` 对应生命周期，不代表统一的 GPU 首帧或可交互时间。

### 基础组件 render {#schema-components}

Web 的 `mpx-view`、`mpx-text`、`mpx-image`、`mpx-scroll-view` 每次真实 render 分别产生 `view:render`、`text:render`、`image:render`、`scroll-view:render`。这些指标代表组件 render 父阶段的同步整体耗时，排除 Vue scheduler、patch、DOM layout/paint、图片网络与解码、滚动事件及 observer callback。

RN 的 getStyle 使用 `instance:render:getStyle` 父阶段及 `instance:render:getStyle:class`、`instance:render:getStyle:style` 子阶段。RN 同时采集 view、simple-view、text、simple-text、image 与 scroll-view 的 `:render` 父阶段和 `:render:<phase>` 子阶段；phase 包括组件支持的 `props`、`style`、`innerProps`、`createElement`。所有 RN 组件指标都排除 effect callback、手势 worklet 和事件后续执行、React commit 与 Native layout。组件父阶段与子阶段、父模板 render 可能存在包含关系，不应相加。

## 性能影响评估 {#perf-impact}

| 能力 | 未录制 | 录制中 |
| --- | --- | --- |
| aggr id 模式 | 状态判断后返回 `-1` | 数组槽位 + free list；稳态零对象、零闭包分配 |
| aggr name 模式 | 保存 name 起点 | Map set/get/delete；只保留聚合桶 |
| trace | 状态判断后 noop | 每个被接受区段一个事件对象和一条进行中映射，默认最多 1024 条 |
| mark | 状态判断后 noop | 每个显式 mark 一个事件对象，默认最多 1022 条，加边界后最多 1024 条 |

::: tip 聚合与事件序列的取舍
高频 render 和函数耗时使用 aggr；需要火焰图或逐区段瀑布图时使用 trace；里程碑使用 mark。trace/mark 不能替代渲染循环中的聚类统计。
:::

## 与现有工具的关系 {#vs-others}

- **平台 Profiler**：提供函数或宿主层采样；trace 提供 Mpx 语义明确的区段序列，同一平台内可按 performance 时钟对照分析。
- **Perfetto / Chrome Trace**：Perf 的 trace 是稳定数据源，业务 Reporter 负责转换和补充进程、线程、分类字段。
- **业务 APM**：Perf 不替代 APM，只提供聚合、区段和里程碑数据。

## Terser / Babel 兼容性约束 {#terser-babel}

- 最终构建依赖 `@mpxjs/perf` 的 `dist/index.js` 保留顶层三元、`sideEffects: false` 与使用方 Terser 完成 DCE。
- 探针调用必须直接置于 `if (__mpx_perf_framework__)` / `if (__mpx_perf_user__)` 字面量条件内。
- 接入方需保留默认 Terser 的 `dead_code` / `conditionals` 优化。
- Babel 不应提前破坏 `__mpx_perf__ ? impl.x : noop.x` 顶层三元结构。
