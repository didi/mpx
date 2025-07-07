import {
  positions,
  justifies,
  orders,
  alignments,
  placements,
  floats
} from '@unocss/preset-mini/rules'

const unSupport = ['sticky']

const blockPositions = positions.map(([rule]) => (raw) => {
  const result = raw.match(rule)
  if (result && unSupport.includes(result[1])) {
    return true
  }
})

// 不支持的规则过滤覆盖
const blockJustifies = [
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

const blockFlexGridJustifiesAlignments = [
  // flex部分不支持
  ...[...blockJustifies, ...placements].map((k) => `flex-${k}`),
  // grid全部不支持
  ...[...justifies, ...alignments, ...placements].map((k) => `grid-${k}`)
]

const blockBoxSizing = [
  'box-content'
]

export {
  blockPositions,
  blockJustifies,
  orders as blockOrders,
  placements as blockPlacements,
  blockFlexGridJustifiesAlignments,
  floats as blockFloats,
  blockBoxSizing
}
