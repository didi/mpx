import { borders } from '@unocss/preset-mini/rules'

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

const bordersRules = borders.map(([rule]) => (raw) => {
  const result = raw.match(rule)
  if (result && unSupport.includes(result[1])) {
    return true
  }
})

export default bordersRules
