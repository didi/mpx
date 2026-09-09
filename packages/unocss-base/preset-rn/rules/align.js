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

const blockVerticalAligns = verticalAligns.map(([rule]) => (raw) => {
  const result = raw.match(rule)
  if (result && !support.includes(result[1])) {
    return true
  }
})

const blockTextAligns = [
  'text-start',
  'text-end',
  'text-align-start',
  'text-align-end'
]

export {
  blockVerticalAligns,
  blockTextAligns
}
