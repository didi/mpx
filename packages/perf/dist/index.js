import * as impl from './impl';
import * as noop from './noop';
import * as reporters from './reporters/console';
// 总开关 __mpx_perf__ 由 webpack-plugin DefinePlugin 注入：
//   true  → 走 impl / reporters，bus、reporter、scopeStart/End、mark/measure 全部生效；
//   false → 全部走 noop。Terser 把 `false ? impl.x : noop.x` 静态折叠后，
//           impl / reporters 两个模块都没有活引用，整段被 tree-shake，
//           bundle 中不残留任何探针字节。
//
// 写成顶层三元而不是 `if (__mpx_perf__) export ...`，目的是让 DefinePlugin 替换
// 之后形成 `false ? real.x : noop.x`，Terser 才能静态消除整支引用
//
// @mpxjs/perf 包内部不感知分组（framework / user / ...）——分组开关只由调用方
// 的字面量条件 `if (__mpx_perf_framework__)` / `if (__mpx_perf_user__)` 决定。
export const scopeStart = __mpx_perf__ ? impl.scopeStart : noop.scopeStart;
export const scopeEnd = __mpx_perf__ ? impl.scopeEnd : noop.scopeEnd;
export const mark = __mpx_perf__ ? impl.mark : noop.mark;
export const measure = __mpx_perf__ ? impl.measure : noop.measure;
export const start = __mpx_perf__ ? impl.start : noop.start;
export const end = __mpx_perf__ ? impl.end : noop.end;
export const setReporter = __mpx_perf__ ? impl.setReporter : noop.setReporter;
export const clearReporter = __mpx_perf__ ? impl.clearReporter : noop.clearReporter;
// 内置 reporter 工厂：与上面 API 同样走三元分流，关闭态下取 noop 壳子，
// reporters/console.ts 对 console 的引用整段被 DCE。
export const createConsoleReporter = __mpx_perf__ ? reporters.createConsoleReporter : noop.createConsoleReporter;
export const consoleReporter = __mpx_perf__ ? reporters.consoleReporter : noop.consoleReporter;
