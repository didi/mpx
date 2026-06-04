# @mpxjs/perf

Mpx2RN 运行时按需测速探针。

详细设计与背景见 [solutions/rn-runtime-perf-probe.md](../../solutions/rn-runtime-perf-probe.md)。

## 设计原则

「编译期常量开关 + 运行时探针实现 + tree-shaking 兜底」三层结构，关闭态下产物里**不含**任何探针代码、字符串字面量、模块依赖。

## API

```ts
import {
  mark, measure, scope,
  start, end,
  setReporter, clearReporter,
  createConsoleReporter, consoleReporter,
  aggregateByName
} from '@mpxjs/perf'
```

| API | 说明 |
| --- | --- |
| `scope(name, meta?)` | 同步代码段起止包裹。返回 `stop()`，调用即记录一条 `measure` 事件。**首选**。 |
| `mark(name, meta?)` | 打一个时间戳。跨作用域起止配对时使用。 |
| `measure(name, start)` | 与 `mark(start, ...)` 配对，记录从 mark 到当前的 measure 事件。 |
| `start()` | 打开录制窗口。重复 start 幂等。 |
| `end()` | 关闭录制窗口，同步把窗口内事件交给 reporter。 |
| `setReporter(r)` | 替换默认 reporter。 |
| `clearReporter()` | 清空 reporter；之后 end 收集到的事件被静默丢弃。 |
| `createConsoleReporter(opts?)` | 工厂函数，定制 console 输出。 |
| `consoleReporter` | 默认 reporter，等价于 `createConsoleReporter()`。 |
| `aggregateByName(events)` | 纯函数聚合工具，返回 `Map<name, { count, sum, avg, max }>`。 |

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

if (__mpx_perf__) setReporter((events) => MyAPM.report(events))
```

### 业务侧自定义探针（user 分组）

```ts
import { scope } from '@mpxjs/perf'

function expensiveCompute (data) {
  let stop: (() => void) | undefined
  if (__mpx_perf_user__) stop = scope('myBiz:list:filter')
  const result = data.filter(/* ... */).sort(/* ... */)
  if (__mpx_perf_user__) stop!()
  return result
}
```

## Terser / babel 兼容性约束

- `@mpxjs/perf` 以**未压缩、未编译**源码形式被引用（`main: "src/index.ts"`），让使用方 webpack 的 ts-loader / babel-loader + Terser 在最终构建里完成 DCE。
- 接入方需保留默认 Terser 配置（不要关闭 minimizer / 不要禁用 `dead_code` / `conditionals`）。
- `babel-preset-env` 不要把三元条件 `__mpx_perf__ ? impl.x : noop.x` 变换平铺，否则 DCE 失效。

## 关闭态零残留

- `__mpx_perf__: false` 时，顶层 `false ? impl.x : noop.x` → `noop.x`，所有对 `impl.x` 的引用消失，`impl.ts` 在 webpack 的 `usedExports` 阶段被标记未使用 → 不进入 chunk。
- `impl.ts` 引用的 `bus.ts` / `reporters/*.ts` 同样级联消失。
- `noop.ts` 的空函数被 Terser inline 后调用点也被消除。
