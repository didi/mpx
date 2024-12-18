import { displays } from '@unocss/preset-mini/rules'
import { findRawRules, transformEmptyRule } from '../../../utils/index.js'

// display不支持的属性抽离并覆盖
const displaysRules = [...transformEmptyRule(findRawRules([
  'inline',
  'block',
  'inline-block',
  'contents',
  'flow-root',
  'list-item'
], displays))]

export {
  displaysRules as displays
}
