const platform = require('./platform')
const templateCompiler = require('./template-compiler/compiler')
const parser = require('./template-compiler/parser')
const pluginCondStrip = require('./style-compiler/plugins/conditional-strip')
const rpx = require('./style-compiler/plugins/rpx')
const scopeId = require('./style-compiler/plugins/scope-id')
const transSpecial = require('./style-compiler/plugins/trans-special')
const trim = require('./style-compiler/plugins/trim')
const vw = require('./style-compiler/plugins/vw')

module.exports.styleCompiler = {
  pluginCondStrip,
  rpx,
  scopeId,
  transSpecial,
  trim,
  vw
}
module.exports.templateCompiler = templateCompiler
module.exports.parser = parser
module.exports.platform = platform
