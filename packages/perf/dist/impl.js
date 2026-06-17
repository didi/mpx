import { bus } from './bus';
// 优先 performance.now（DOM / RN web）→ Hermes nativePerformanceNow → Date.now 兜底。
// Hermes 的 nativePerformanceNow 是 globalThis 上的专有 API，标准 lib.dom 类型里没有,
// 用窄类型断言把它声明出来——避免使用 ts-ignore 注释（ban-ts-comment 规则会拦截）。
const now = (() => {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        return () => performance.now();
    }
    const g = (typeof globalThis !== 'undefined' ? globalThis : undefined);
    if (g && typeof g.nativePerformanceNow === 'function') {
        const native = g.nativePerformanceNow;
        return () => native();
    }
    return () => Date.now();
})();
// 跨作用域的起止配对靠 mark name 匹配；同步代码内首选用 scopeStart/scopeEnd。
const marks = new Map();
// scopeStart/scopeEnd 用平行数组持有进行中的 scope，避免每次 scope 分配闭包对象。
// stackName / stackStart 同步增长；freeList 回收已结束的槽位 id。
// 不依赖严格栈序（freeList 处理乱序结束与提前 end）；React render 实际就是栈式，
// freeList 池稳态后槽位数 == 最大并发深度，不再增长。
const stackName = [];
const stackStart = [];
const freeList = [];
let stackTop = 0;
/**
 * 起一段 scope，返回 id 句柄；未录制时返回 -1，调用方据此跳过 scopeEnd。
 * 录制态下也仅做：状态判断、freeList/stackTop 取 id、一次 now()、两次数组下标写。
 * 全程无对象 / 闭包分配——这是高频 render 场景的核心优化。
 */
export function scopeStart(name) {
    if (!bus.isRecording())
        return -1;
    const id = freeList.length > 0 ? freeList.pop() : stackTop++;
    stackName[id] = name;
    stackStart[id] = now();
    return id;
}
/**
 * 关闭 id 对应的 scope，把时长累加进聚合。
 * id < 0（未录制时 scopeStart 的返回）或已被 end 过都安全 no-op。
 */
export function scopeEnd(id) {
    if (id < 0)
        return;
    const name = stackName[id];
    if (name === null)
        return;
    const dur = now() - stackStart[id];
    // 清 name 表示该槽空闲，避免重复 end 重复累加；id 回收进 freeList。
    stackName[id] = null;
    freeList.push(id);
    bus.pushMeasure(name, dur);
}
/**
 * 仅记录时间戳，不进聚合。与 measure 配对使用以跨越作用域起止。
 * mark 单独不构成时长样本，故不调 bus.pushMeasure。
 */
export function mark(name) {
    marks.set(name, now());
}
/**
 * 取 start mark 的时间，算出至今的时长，作为一条样本进聚合。
 * 用过即清，避免同名 mark 残留导致下一轮 measure 误命中旧时间戳。
 */
export function measure(name, start) {
    const s = marks.get(start);
    if (s === undefined)
        return;
    const dur = now() - s;
    marks.delete(start);
    bus.pushMeasure(name, dur);
}
// 录制窗口控制
export const start = () => bus.start();
export const end = (reporter) => bus.end(reporter);
// reporter 注册 API
export const setReporter = (r) => bus.setReporter(r);
export const clearReporter = () => bus.setReporter(undefined);
