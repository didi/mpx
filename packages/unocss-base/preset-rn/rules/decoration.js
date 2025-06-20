import { textDecorations } from '@unocss/preset-mini/rules'
import { isReg } from '../../utils/index'

const unSupport = [
  'auto',
  'from-font',
  'overline'
]

const textDecorationsRules = textDecorations.map(([rule]) => (raw) => {
  if (isReg(rule)) {
    const result = raw.match(rule)
    if (result && unSupport.includes(result[1])) {
      return true
    }
  }
})

const rules = [
  // size
  /^(?:underline|decoration)-(auto|from-font)$/,
  // offset
  /^(?:underline|decoration)-offset-(.+)$/,
  // wavy style
  'underline-wavy',
  'decoration-wavy'
]

export default [
  ...textDecorationsRules,
  ...rules
]
