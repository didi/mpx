const platform = require('./platform')
const templateCompiler = require('./template-compiler/compiler')
const parser = require('./template-compiler/parser')
const pluginCondStrip = require('./style-compiler/plugins/conditional-strip')
const rpx = require('./style-compiler/plugins/rpx')
const scopeId = require('./style-compiler/plugins/scope-id')
const transSpecial = require('./style-compiler/plugins/trans-special')
const loadPostcssConfig = require('./style-compiler/loadPostcssConfig')
const trim = require('./style-compiler/plugins/trim')
const vw = require('./style-compiler/plugins/vw')
const scriptSetupCompiler = require('./script-setup-compiler/index')

module.exports.styleCompiler = {
  loadPostcssConfig,
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
module.exports.scriptSetupCompiler = scriptSetupCompiler
