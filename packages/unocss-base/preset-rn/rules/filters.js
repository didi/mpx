const { rules } = require('@unocss/preset-wind')
const { findRawRules, ruleFallback, isFunction, transformEmptyRule } = require('../../utils')

// todo filter 只支持部分属性
const filters = findRawRules([
  'filter-blur',
  'filter-brightness-1',
  'filter-contrast-1',
  'filter-grayscale-1',
  'filter-hue-rotate-1',
  'filter-invert-1',
  'filter-saturate-1',
  'filter-sepia-1'
], rules, true)

// backdrop-filter 不支持
const backdropFilter = findRawRules([
  /^backdrop-filter-*/
], rules)

const newFilters = filters.map(item => {
  return [item[0], ([match], { generator }) => {
    if (/^backdrop/.test(match)) {
      return ruleFallback(match, generator)
    } else {
      return (isFunction(item[1]) && item[1]()) || ''
    }
  }]
})

module.exports = [
  ...newFilters,
  ...transformEmptyRule(backdropFilter)
]
