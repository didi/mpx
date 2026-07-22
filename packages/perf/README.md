# @mpxjs/perf

Mpx2RN 运行时按需性能探针，支持实时耗时聚合和有界 mark 时间线。

## 设计原则

「编译期常量开关 + 运行时探针实现 + tree-shaking 兜底」三层结构，关闭态下产物里**不含**探针代码、名称字符串或模块依赖。

- measure 在录制窗口内实时聚合为 `Map<name, AggResult>`，不保存逐次耗时样本。
- mark 按调用顺序保留为时间线事件，同名事件不合并。
- 时间线包含自动生成的 `start` / `end` 边界，固定最多 256 条：1 个 start、最多 254 个显式 mark、1 个 end。

## API

```ts
import {
  scopeStart, scopeEnd,
  measureStart, measureEnd,
  mark,
  start, end,
  setReporter, clearReporter,
  createConsoleReporter, consoleReporter
} from '@mpxjs/perf'
```

| API | 说明 |
| --- | --- |
| `scopeStart(name): number` | 开始同步 scope，返回数字句柄。未录制时返回 `-1`。高频同步路径首选。 |
| `scopeEnd(id): void` | 结束 scope 并将耗时聚合到同名桶。`id < 0` 或重复结束安全 noop。 |
| `measureStart(name): void` | 注册跨作用域耗时的具名起点。 |
| `measureEnd(name): void` | 消费同名起点，并将耗时聚合到同名桶；找不到起点时 noop。 |
| `mark(name): void` | 向当前窗口追加一条独立、有序的时间线事件；未录制时 noop。 |
| `start(): void` | 打开录制窗口并生成 `{ name: 'start', at: 0 }`。重复 start 幂等。 |
| `end(reporter?): void` | 生成 `end` 边界并同步触发全局及可选局部 reporter。未 start 时 noop。 |
| `setReporter(r)` | 替换全局 reporter。 |
| `clearReporter()` | 清空全局 reporter。 |
| `createConsoleReporter(opts?)` | 创建可配置的 console reporter。 |
| `consoleReporter` | 默认 reporter，等价于 `createConsoleReporter()`。 |

`AggResult` 包含 `count` / `sum` / `avg` / `max`，时长单位均为 ms。`MarkTimeline.events` 包含 `{ name, at }`，其中 `at` 是相对当前 `start()` 的毫秒偏移；`dropped` 表示超过时间线容量后丢弃的显式 mark 数。

这是一次直接 API 变更：旧 `mark(name)` 起点改为 `measureStart(name)`，旧 `measure(resultName, startName)` 改为同名的 `measureEnd(name)`，不再导出旧 `measure`。

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

### 录制窗口与时间线

```ts
import { start, mark, end } from '@mpxjs/perf'

if (__mpx_perf__) start()

loadPageData().then(() => {
  if (__mpx_perf_user__) mark('goods:data-ready')
})

onPageInteractive(() => {
  if (__mpx_perf_user__) mark('goods:interactive')
  if (__mpx_perf__) end()
})
```

即使没有 measure 和显式 mark，正常结束的窗口也会用 start/end 两条边界事件触发 reporter。

### 同步与跨作用域耗时

```ts
import {
  scopeStart, scopeEnd,
  measureStart, measureEnd
} from '@mpxjs/perf'

function expensiveCompute (data) {
  let id = -1
  if (__mpx_perf_user__) id = scopeStart('myBiz:list:filter')
  const result = data.filter(/* ... */).sort(/* ... */)
  if (__mpx_perf_user__) scopeEnd(id)
  return result
}

if (__mpx_perf_user__) measureStart('goods:request')
loadPageData().finally(() => {
  if (__mpx_perf_user__) measureEnd('goods:request')
})
```

`measureStart` / `measureEnd` 使用同一个名称作为配对 key 和聚合桶名。同名并发 measure 会由后一次起点覆盖前一次；第一次成功的 `measureEnd` 会消费起点。

### 自定义 reporter

```ts
import { setReporter } from '@mpxjs/perf'
import type { AggResult, MarkTimeline } from '@mpxjs/perf'

if (__mpx_perf__) {
  setReporter((measures: Map<string, AggResult>, timeline?: MarkTimeline) => {
    MyAPM.reportMeasures(measures)
    if (timeline) MyAPM.reportTimeline(timeline)
  })
}
```

Reporter 签名为 `(measures, timeline?) => void`。通过 `start/end` 结束的窗口始终传入 timeline；第二参数保持可选，以兼容单参数 reporter 和手动调用。

全局与 `end(localReporter)` 传入的局部 reporter 会依次收到同一份 Map 和 timeline 引用。不要修改它们；需要保留或改写时请自行复制。

`createConsoleReporter({ sortBy, filter, header })` 会分别输出 measures 与 timeline。`sortBy` 只排序 measure；timeline 永远保持调用顺序。`filter` 会过滤 measure 和显式 mark，但不会隐藏内建 start/end；发生容量截断时会输出 dropped 提示。

## 性能特性

- `scopeStart` 录制态使用数组槽位和数字句柄，不分配闭包或事件对象。
- measure push 阶段仅执行 `Map.get` 与数值累加，每个新桶分配一个 `AggResult`。
- `mark` 未录制时只做一次状态判断；录制时每条事件分配一个小对象，最多保留 254 条显式事件。
- `start/end` 每个窗口固定生成两个边界事件；达到 256 条总上限后只累计 `dropped`，并始终保留 end。

## Terser / Babel 约束

- 最终构建依赖 `dist/index.js` 保留的顶层 `__mpx_perf__ ? impl.x : noop.x` 三元、`sideEffects: false` 和使用方 Terser 完成 DCE。
- 探针调用必须直接放在 `if (__mpx_perf_user__)` / `if (__mpx_perf_framework__)` 字面量条件内。
- 接入方需保留默认 Terser 的 `dead_code` / `conditionals` 优化；Babel 不应提前破坏顶层三元结构。
