import {
  positions,
  justifies,
  orders,
  alignments,
  placements,
  floats
} from '@unocss/preset-mini/rules'

const unSupport = ['sticky', 'fixed']

const positionsRules = positions.map(([rule]) => (raw) => {
  const result = raw.match(rule)
  if (result && unSupport.includes(result[1])) {
    return true
  }
})

// 不支持的规则过滤覆盖
const justifiesRules = [
  'justify-left',
  'justify-right',
  'justify-stretch',
  'justify-items-center',
  'justify-items-end',
  'justify-items-start',
  'justify-items-stretch',
  'justify-self-auto',
  'justify-self-center',
  'justify-self-end',
  'justify-self-stretch',
  'justify-self-start'
]

const flexGridJustifiesAlignments = [
  // flex部分不支持
  ...[...justifiesRules, ...placements].map((k) => `flex-${k}`),
  // grid全部不支持
  ...[...justifies, ...alignments, ...placements].map((k) => `grid-${k}`)
]

const boxSizing = [
  'box-content'
]

export {
  positionsRules as positions,
  justifiesRules as justifies,
  orders,
  placements,
  flexGridJustifiesAlignments,
  floats,
  boxSizing
}
