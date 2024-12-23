import { divides } from '@unocss/preset-wind/rules'
import { ruleCallback } from '../../utils/index.js'

const unSupport = ['s', 'e', 'bs', 'be', 'is', 'ie', 'block', 'inline']

const divideRules = divides.map(v => {
  const [regex, matcher, ...another] = v
  return [
    regex,
    (...args) => {
      const [[, direction]] = args
      if (unSupport.includes(direction)) return ruleCallback(...args)
      return matcher(...args)
    },
    ...another
  ]
})

export { divideRules as divides }
