/**
 @file web运行时组件抹平中需要用到的一些工具方法
 */
/**
 * 处理字符串类型的宽高数值，兼容rpx
 * @param {object | number} size 宽高
 * @param {object} option 配置项，目前仅支持配置默认值
 * @param {number} option.default 默认值,当传入的size有问题时返回
 * @returns {number} 处理后的数字宽高，单位px
 */
export function processSize(size: object | number, option?: {
    default: number;
}): number;
export function type(n: any): string;
export function isEmptyObject(obj: any): boolean;
export const isBrowser: boolean;
