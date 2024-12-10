import { filters } from '@unocss/preset-wind/rules'
import { findRawRules, ruleFallback, isFunction, transformEmptyRule } from  '../../utils/index.js'

// todo filter 只支持部分属性
const newFilters = findRawRules([
  'filter-blur',
  'filter-brightness-1',
  'filter-contrast-1',
  'filter-grayscale-1',
  'filter-hue-rotate-1',
  'filter-invert-1',
  'filter-saturate-1',
  'filter-sepia-1'
], filters, true).map(item => {
  return [item[0], ([match], { generator }) => {
    if (/^backdrop/.test(match)) {
      return ruleFallback(match, generator)
    } else {
      return (isFunction(item[1]) && item[1]()) || ''
    }
  }]
})

// backdrop-filter 不支持
const backdropFilter = findRawRules([
  /^backdrop-filter-*/
], filters)

export default [
  ...newFilters,
  ...transformEmptyRule(backdropFilter)
]
