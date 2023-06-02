import { presetUno } from '@unocss/preset-uno'
import theme from './theme'

export function presetBase(options = { preflight: false }) {
  const uno = presetUno(options)
  return {
    ...uno,
    name: '@mpxjs/unocss-base',
    theme: {
      ...uno.theme,
      ...theme,
    },
  }
}
