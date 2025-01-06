import { filters, filterBase } from '@unocss/preset-wind/rules'
import { transformEmptyRule, findRawRules, ruleCallback, isReg, isString } from '../../utils/index.js'

const newFilters = filters.map(v => {
  const [regex, matcher, ...another] = v
  if (typeof matcher === 'function') {
    return [
      regex,
      (...args) => {
        const [[r]] = args
        if (/^backdrop/.test(r)) return ruleCallback(...args)
        return matcher(...args)
      },
      ...another
    ]
  }
  return v
})

const backDropFilter = transformEmptyRule(
  findRawRules(['backdrop-filter', 'backdrop-filter-none'], filters)
)

const filterBaseRule = [
  ['filter', null],
  ['filter', {
    ...filterBase,
    filter: 'var(--un-blur) var(--un-brightness) var(--un-contrast) var(--un-drop-shadow) var(--un-grayscale) var(--un-hue-rotate) var(--un-invert) var(--un-saturate) var(--un-sepia)'
  }]
]

const filterRules = filters.map(([rule]) => (raw) => {
  const reg = /^backdrop-/
  let result = ''
  if (isString(rule)) {
    result = rule
  } else if (isReg(rule)) {
    const matcher = raw.match(rule)
    if (matcher) {
      result = matcher[0]
    }
  }
  return reg.test(result)
})

newFilters.push(...backDropFilter, ...filterBaseRule)

export default newFilters
