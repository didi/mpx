import { gaps } from '@unocss/preset-mini/rules'

const blockGaps = gaps.map(([rule]) => (raw) => {
  const result = raw.match(rule)
  if (result && result[0].startsWith('grid')) {
    return true
  }
})

export {
  blockGaps
}
