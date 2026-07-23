// 关闭态下导出的全部空实现。
// 通过 src/index.ts 顶层 `__mpx_perf__ ? impl.x : noop.x` 三元判断分流，
// 关闭态下 impl 模块在 Terser DCE 后整体被 tree-shake；noop 留下的
// 函数体本身就是空的，调用点也会被 inline 消除。
//
// 整个模块的存在意义就是「空函数」——给 eslint 关掉 no-empty-function 比逐行
// disable 更直观。
/* eslint-disable @typescript-eslint/no-empty-function */
import type { Reporter } from './types'

// scopeStart 关闭态恒返回 -1，与开启态未录制时的语义一致；
// 调用方 `let id = -1; ...; perf.scopeEnd(id)` 在关闭态下被 inline 后等价于
// `let id = -1`，配合 Terser DCE 整段消失。
export const scopeStart = (_name: string): number => -1
export const scopeEnd = (_id: number) => {}

export const mark = (_name: string) => {}
export const measureStart = (_name: string) => {}
export const measureEnd = (_name: string) => {}

export const start = () => {}
export const end = (_reporter?: Reporter) => {}

export const setReporter = (_r: Reporter) => {}
export const clearReporter = () => {}

// 同样要为 reporter 提供关闭态壳子，保证 src/index.ts 顶层导出全部走
// `__mpx_perf__ ? impl.x : noop.x` 三元——任何活引用在关闭态下都被静态替换为
// noop，从而让 Terser 把 reporters/console.ts 及其依赖整段 tree-shake 掉。
//
// 业务侧典型用法：
//   import { consoleReporter, setReporter } from '@mpxjs/perf'
//   setReporter(consoleReporter)   // 关闭态下 consoleReporter 是 noop reporter
export const consoleReporter: Reporter = (_agg) => {}
export const createConsoleReporter = (_options?: object): Reporter => (_agg) => {}
