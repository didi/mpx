import type { Reporter } from './types';
/**
 * 起一段 scope，返回 id 句柄；未录制时返回 -1，调用方据此跳过 scopeEnd。
 * 录制态下也仅做：状态判断、freeList/stackTop 取 id、一次 now()、两次数组下标写。
 * 全程无对象 / 闭包分配——这是高频 render 场景的核心优化。
 */
export declare function scopeStart(name: string): number;
/**
 * 关闭 id 对应的 scope，把时长累加进聚合。
 * id < 0（未录制时 scopeStart 的返回）或已被 end 过都安全 no-op。
 */
export declare function scopeEnd(id: number): void;
/**
 * 仅记录时间戳，不进聚合。与 measure 配对使用以跨越作用域起止。
 * mark 单独不构成时长样本，故不调 bus.pushMeasure。
 */
export declare function mark(name: string): void;
/**
 * 取 start mark 的时间，算出至今的时长，作为一条样本进聚合。
 * 用过即清，避免同名 mark 残留导致下一轮 measure 误命中旧时间戳。
 */
export declare function measure(name: string, start: string): void;
export declare const start: () => void;
export declare const end: (reporter?: Reporter) => void;
export declare const setReporter: (r: Reporter) => void;
export declare const clearReporter: () => void;
