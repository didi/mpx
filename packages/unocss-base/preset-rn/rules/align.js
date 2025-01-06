import { verticalAligns } from '@unocss/preset-mini/rules'

const support = [
  'mid',
  'start',
  'btm',
  'end',
  'auto',
  'top',
  'bottom',
  'middle'
]

const verticalAlignsRules = verticalAligns.map(([rule]) => (raw) => {
  const result = raw.match(rule)
  if (result && !support.includes(result[1])) {
    return true
  }
})

const textAligns = [
  'text-start',
  'text-end',
  'text-align-start',
  'text-align-end'
]

export {
  verticalAlignsRules as verticalAligns,
  textAligns
}
