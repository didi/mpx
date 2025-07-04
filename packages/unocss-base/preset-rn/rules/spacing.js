import { margins, paddings } from '@unocss/preset-mini/rules'
import { spaces } from '@unocss/preset-wind3/rules'

const unSupport = [
  's',
  'e',
  'bs',
  'be',
  'is',
  'ie',
  'block',
  'inline'
]

const blockPaddingAndMargins = [...paddings, ...margins].map(([rule]) => (raw) => {
  const result = raw.match(rule)
  if (result && unSupport.includes(result[1])) {
    return true
  }
})

export {
  blockPaddingAndMargins,
  spaces as blockSpaces
}
