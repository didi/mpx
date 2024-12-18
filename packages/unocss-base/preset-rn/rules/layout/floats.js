import { floats } from '@unocss/preset-mini/rules'
import { transformEmptyRule } from '../../../utils/index.js'

// flex 不支持的属性抽离并覆盖
const floatsRules = transformEmptyRule(floats)

export {
  floatsRules as floats
}
