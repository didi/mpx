const { presetUno } = require('@unocss/preset-uno')
const theme = require('./theme')

module.exports = function presetMpx (options = { preflight: false }) {
  const uno = presetUno(options)
  return {
    ...uno,
    name: '@mpxjs/unocss-base',
    theme: {
      ...uno.theme,
      ...theme
    }
  }
}
