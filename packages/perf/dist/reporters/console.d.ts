import type { Reporter } from '../types';
export interface ConsoleReporterOptions {
    /** 排序字段，默认按 sum 降序 */
    sortBy?: 'sum' | 'avg' | 'max' | 'count';
    /** 仅打印事件名匹配该正则 / 字符串前缀的桶 */
    filter?: RegExp | string;
    /** 是否带 console.group 头，默认 true */
    header?: boolean;
}
/**
 * 工厂函数：根据 options 生成一个 console reporter。
 *
 * 入参从 bus 拿到的就是已聚合的 `Map<name, AggResult>`（实时聚合 only），
 * 不再有原始事件可遍历——所以也没有 raw 选项了。
 *
 * 输出形式刻意避开 console.table —— React Native 远程调试 / Hermes inspector
 * 对 console.table 的支持参差不齐（典型表现是把每行渲染成 `{…}` 不展开），
 * 这里用对齐字符串 + 单条 console.log 输出，跨 RN / 浏览器 / Node 一致可读。
 */
export declare function createConsoleReporter(options?: ConsoleReporterOptions): Reporter;
/**
 * 默认 reporter：bus 在未被 setReporter 替换时使用它。
 * 行为等价于 createConsoleReporter() 默认参数。
 */
export declare const consoleReporter: Reporter;
