// scopeStart 关闭态恒返回 -1，与开启态未录制时的语义一致；
// 调用方 `let id = -1; ...; perf.scopeEnd(id)` 在关闭态下被 inline 后等价于
// `let id = -1`，配合 Terser DCE 整段消失。
export const scopeStart = (_name) => -1;
export const scopeEnd = (_id) => { };
export const mark = (_name) => { };
export const measure = (_name, _start) => { };
export const start = () => { };
export const end = (_reporter) => { };
export const setReporter = (_r) => { };
export const clearReporter = () => { };
// 同样要为 reporter 提供关闭态壳子，保证 src/index.ts 顶层导出全部走
// `__mpx_perf__ ? impl.x : noop.x` 三元——任何活引用在关闭态下都被静态替换为
// noop，从而让 Terser 把 reporters/console.ts 及其依赖整段 tree-shake 掉。
//
// 业务侧典型用法：
//   import { consoleReporter, setReporter } from '@mpxjs/perf'
//   setReporter(consoleReporter)   // 关闭态下 consoleReporter 是 noop reporter
export const consoleReporter = (_agg) => { };
export const createConsoleReporter = (_options) => (_agg) => { };
