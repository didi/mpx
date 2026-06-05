// 关闭态下导出的全部空实现。
// 通过 src/index.ts 顶层 `__mpx_perf__ ? impl.x : noop.x` 三元判断分流，
// 关闭态下 impl 模块在 Terser DCE 后整体被 tree-shake；noop 留下的
// 函数体本身就是空的，调用点也会被 inline 消除。
//
// 整个模块的存在意义就是「空函数」——给 eslint 关掉 no-empty-function 比逐行
// disable 更直观。
/* eslint-disable @typescript-eslint/no-empty-function */
import type { PerfEvent, Reporter, AggResult } from './types'

export const mark = (_name: string, _meta?: object) => {}
export const measure = (_name: string, _start: string) => {}
export const scope = (_name: string, _meta?: object) => () => {}

export const start = () => {}
export const end = (_reporter?: Reporter) => {}

export const setReporter = (_r: Reporter) => {}
export const clearReporter = () => {}

// 同样要为 reporter / 聚合工具提供关闭态壳子，保证 src/index.ts 顶层导出
// 全部走 `__mpx_perf__ ? impl.x : noop.x` 三元——任何活引用在关闭态下都被
// 静态替换为 noop，从而让 Terser 把 reporters/console.ts、aggregate.ts、
// 以及它们的依赖整段 tree-shake 掉。
//
// 业务侧典型用法：
//   import { consoleReporter, setReporter } from '@mpxjs/perf'
//   setReporter(consoleReporter)   // 关闭态下 consoleReporter 是 noop reporter
export const consoleReporter: Reporter = (_events) => {}
export const createConsoleReporter = (_options?: object): Reporter => (_events) => {}
export const aggregateByName = (_events: PerfEvent[]): Map<string, AggResult> => new Map()
