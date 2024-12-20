import { containerParent } from '@unocss/preset-mini/rules'
import { transformEmptyRule } from '../../utils/index.js'

const containerParentRules = transformEmptyRule(containerParent)

// TODO wind container

export {
  containerParentRules as containerParent
}
