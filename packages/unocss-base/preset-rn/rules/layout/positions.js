import { positions } from '@unocss/preset-mini/rules'
import { ruleCallback } from '../../../utils'

/**
  position-absolute
  position-inherit
  position-fixed
  position-initial
  position-relative
  position-revert
  position-revert-layer
  position-unset
  position-sticky
  position-static
 */

const unSupport = ['inherit', 'fixed', 'initial', 'revert', 'revert-layer', 'unset', 'sticky']

// position 不支持的属性抽离并覆盖
const positionsRules = [
  ...positions.map(v => {
    const [regex, matcher, meta] = v
    return [
      regex,
      (...args) => {
        const [[, v]] = args
        if (unSupport.includes(v)) return ruleCallback(...args)
        return matcher(...args)
      },
      meta
    ]
  })
]

export { positionsRules as positions }
