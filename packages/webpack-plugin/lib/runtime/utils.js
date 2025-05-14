/**
 * 处理字符串类型的宽高数值，兼容rpx
 * @param {object | number} size 宽高
 * @param {object} option 配置项，目前仅支持配置默认值
 * @param {number} option.default 默认值,当传入的size有问题时返回
 * @returns {number} 处理后的数字宽高，单位px
 */
export function processSize (size, option = {}) {
  const defaultValue = option.default || 0
  if (typeof size === 'number') {
    return size
  } else if (typeof size === 'string') {
    const rs = parseInt(size, 10)
    if (size.indexOf('rpx') !== -1) {
      // 计算rpx折算回px
      const width = window.screen.width
      const finalRs = Math.floor(rs / 750 * width)
      return finalRs
    } else {
      return isNaN(rs) ? defaultValue : rs
    }
  } else {
    return defaultValue
  }
}

// 判断对象类型
export function type (n) {
  return Object.prototype.toString.call(n).slice(8, -1)
}

export function isEmptyObject (obj) {
  if (!obj) {
    return true
  }
  /* eslint-disable no-unreachable-loop */
  for (const key in obj) {
    return false
  }
  return true
}

const hasOwnProperty = Object.prototype.hasOwnProperty

export function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}

export const extend = Object.assign
