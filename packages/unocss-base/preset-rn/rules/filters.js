import { filters } from '@unocss/preset-wind3/rules'
import { isReg, isString } from '../../utils/index'

const unSupport = [
  'backdrop-filter',
  'backdrop-filter-none'
]

export const blockFilters = filters.map(([rule]) => (raw) => {
  const reg = /^backdrop-/
  let result = ''
  if (isString(rule) && unSupport.includes(raw)) {
    return true
  } else if (isReg(rule)) {
    const matcher = raw.match(rule)
    if (matcher) {
      result = matcher[0]
      return reg.test(result)
    }
  }
})

