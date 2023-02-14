/**
 * 判断当前环境是否是浏览器环境
 */
export const isBrowser = typeof window !== 'undefined'

const hasOwnProperty = Object.prototype.hasOwnProperty

export function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key)
}
