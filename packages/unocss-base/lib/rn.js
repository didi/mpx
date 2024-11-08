const presetRn = require('../preset-rn')

module.exports = function presetRnMpx (options = {}) {
  return {
    name: '@mpxjs/unocss-preset-rn',
    ...presetRn
  }
}
