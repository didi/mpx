import { flex } from '@unocss/preset-mini/rules'
import { findRawRules, transformEmptyRule } from '../../../utils/index.js'

/**
  flex
  flex-auto
  flex-basis-lg
  flex-basis-none
  flex-basis-sm
  flex-basis-xl
  flex-basis-xs
  flex-col
  flex-col-reverse
  flex-initial
  flex-inline
  flex-none
  flex-nowrap
  flex-row
  flex-row-reverse
  flex-wrap
  flex-wrap-reverse
  flex-1
  flex-basis-2xl
  flex-basis-3xl
  flex-grow-0
  flex-grow-1
  flex-grow-2
  flex-shrink-0
  flex-shrink-1
  flex-shrink-2
 */

// flex 不支持的属性抽离并覆盖
const flexRules = [...transformEmptyRule(findRawRules([
  'flex-inline',
  'inline-flex'
], flex))]

export {
  flexRules as flex
}
