const { presetUno } = require('@unocss/preset-uno')

const remRE = /(-?[\.\d]+)rem/g

module.exports = function presetMpx (options = { preflight: false, baseFontSize: 37.5 }) {
  const uno = presetUno(options)
  const { baseFontSize } = options
  return {
    ...uno,
    name: '@mpxjs/unocss-base',
    postprocess: (util) => {
      util.entries.forEach((i) => {
        const value = i[1]
        if (typeof value === 'string' && remRE.test(value))
          i[1] = value.replace(remRE, (_, p1) => `${p1 * baseFontSize}rpx`)
      })
    }
  }
}
