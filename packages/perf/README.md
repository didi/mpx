# @mpxjs/perf

Mpx2RN 运行时按需测速探针。

详细设计与背景见 [solutions/rn-runtime-perf-probe.md](../../solutions/rn-runtime-perf-probe.md)。

## 设计原则

「编译期常量开关 + 运行时探针实现 + tree-shaking 兜底」三层结构，关闭态下产物里**不含**任何探针代码、字符串字面量、模块依赖。

**实时聚合 only**：录制窗口内只维护 `Map<name, AggResult>`，不保留逐条事件，对 GC / 内存压力近乎为零；reporter 收到的就是已聚合的结果。

## API

```ts
import {
  scopeStart, scopeEnd,
  mark, measure,
  start, end,
  setReporter, clearReporter,
  createConsoleReporter, consoleReporter
} from '@mpxjs/perf'
```

| API | 说明 |
| --- | --- |
| `scopeStart(name): number` | 起一段 scope，返回 id 句柄。未录制时返回 `-1`。**首选**。无闭包 / 对象分配。 |
| `scopeEnd(id): void` | 关闭 id 对应的 scope，累加进聚合。`id < 0` 或重复 end 安全 noop。 |
| `mark(name)` | 仅打一个时间戳，**不进聚合**。跨作用域起止配对时使用。 |
| `measure(name, start)` | 与 `mark(start)` 配对，记录从 mark 到当前的样本进聚合。mark 用过即清。 |
| `start()` | 打开录制窗口；清空上一次聚合结果。重复 start 幂等。 |
| `end(reporter?)` | 关闭录制窗口，回填 `avg = sum/count` 后把 `Map<name, AggResult>` 同步交给全局 reporter；传入局部 reporter 时同批次追加触发一次。 |
| `setReporter(r)` | 替换全局 reporter。 |
| `clearReporter()` | 清空全局 reporter；之后 end 收集到的结果被静默丢弃。 |
| `createConsoleReporter(opts?)` | 工厂函数，定制 console 输出。 |
| `consoleReporter` | 默认 reporter，等价于 `createConsoleReporter()`。 |

`AggResult` 字段：`count` / `sum`（ms）/ `avg`（ms）/ `max`（ms）。`avg` 仅在 end 时回填，push 阶段不算除法。

## 接入

### 业务侧 mpx.config.js

```js
// mpx.config.js
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

### 业务侧 RN 入口（最小用法）

```ts
import { start, end } from '@mpxjs/perf'

// 默认 reporter 即 consoleReporter，无需调 setReporter。
const onEnter = () => { if (__mpx_perf__) start() }
const onLeave = () => { if (__mpx_perf__) end() }
```

### 业务侧自定义 reporter

```ts
import { setReporter } from '@mpxjs/perf'
import type { AggResult } from '@mpxjs/perf'

if (__mpx_perf__) {
  setReporter((agg: Map<string, AggResult>) => {
    // agg 是 bus 内部的 Map 引用，不要直接修改；如需保留请自行复制。
    const payload: Record<string, AggResult> = {}
    for (const [name, s] of agg) payload[name] = s
    MyAPM.report(payload)
  })
}
```

`setReporter` 注册的是全局 reporter。只想在某一次录制窗口结束时额外上报，可把局部 reporter 传给 `end`，它不会替换全局 reporter：

```ts
import { start, end } from '@mpxjs/perf'

const onSubmit = () => {
  if (__mpx_perf__) start()
  doSubmit()
  if (__mpx_perf__) end((agg) => MyAPM.report('submit_perf', agg))
}
```

### 业务侧自定义探针（user 分组）

```ts
import { scopeStart, scopeEnd } from '@mpxjs/perf'

function expensiveCompute (data) {
  let id = -1
  if (__mpx_perf_user__) id = scopeStart('myBiz:list:filter')
  const result = data.filter(/* ... */).sort(/* ... */)
  if (__mpx_perf_user__) scopeEnd(id)
  return result
}
```

> 推荐统一用 `let id = -1` + `scopeStart` / `scopeEnd` 句柄形式。`id` 是 number，未录制时为 `-1`，调用 `scopeEnd(-1)` 是安全 noop——配合 `if (__mpx_perf_user__)` 字面量门禁 + Terser DCE，关闭态零残留。

## 性能特性

- 单次 `scopeStart` 录制态成本：状态判断 + freeList/stackTop 取 id + 一次 `now()` + 两次数组下标写。**零对象 / 零闭包分配**。
- `scopeStart` 未录制态成本：单次状态判断 → 返回 `-1`，不调 `now()`、不写数组。
- `pushMeasure` 阶段聚合：单次 `Map.get` + 数值累加（首样本一次 `Map.set` 分配 `AggResult`）。窗口生命周期内每个 bucket 仅一次小对象分配。
- 窗口结束不再保留事件数组——end() 即可触发 reporter；reporter 拿到的就是 `Map<name, AggResult>`。

## Terser / babel 兼容性约束

- `@mpxjs/perf` 以**未压缩、未编译**源码形式被引用（`main: "src/index.ts"`），让使用方 webpack 的 ts-loader / babel-loader + Terser 在最终构建里完成 DCE。
- 接入方需保留默认 Terser 配置（不要关闭 minimizer / 不要禁用 `dead_code` / `conditionals`）。
- `babel-preset-env` 不要把三元条件 `__mpx_perf__ ? impl.x : noop.x` 变换平铺，否则 DCE 失效。

## 关闭态零残留

- `__mpx_perf__: false` 时，顶层 `false ? impl.x : noop.x` → `noop.x`，所有对 `impl.x` 的引用消失，`impl.ts` 在 webpack 的 `usedExports` 阶段被标记未使用 → 不进入 chunk。
- `impl.ts` 引用的 `bus.ts` / `reporters/*.ts` 同样级联消失。
- `noop.ts` 的空函数被 Terser inline 后调用点也被消除。
