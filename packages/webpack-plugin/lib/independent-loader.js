const parseComponent = require('./parser')
const createHelpers = require('./helpers')
const CommonJsVariableDependency = require('./dependencies/CommonJsVariableDependency')
const path = require('path')
const normalize = require('./utils/normalize')

module.exports = function (content) {
  this.cacheable()
  const mpx = this.getMpx()
  if (!mpx) {
    return content
  }

  const mode = mpx.mode
  const env = mpx.env
  const i18n = mpx.i18n
  const filePath = this.resourcePath
  const extname = path.extname(filePath)
  if (extname === '.mpx') {
    const parts = parseComponent(content, {
      filePath,
      needMap: this.sourceMap,
      mode,
      env
    })
    const {
      getRequire
    } = createHelpers(this)

    if (parts.script) {
      content = getRequire('script', parts.script)
    } else {
      content = ''
    }
  }

  let output = 'global.isIndependent = true\n'
  // 注入i18n
  if (i18n) {
    const i18nWxsPath = normalize.lib('runtime/i18n.wxs')
    const i18nWxsLoaderPath = normalize.lib('wxs/i18n-loader.js')
    const i18nWxsRequest = i18nWxsLoaderPath + '!' + i18nWxsPath
    const i18nMethodsVar = 'i18nMethods'
    this._module.addDependency(new CommonJsVariableDependency(i18nWxsRequest, i18nMethodsVar))

    output += `if (!global.i18n) {
  global.i18n = ${JSON.stringify({
    locale: i18n.locale,
    version: 0
  })}
  global.i18nMethods = ${i18nMethodsVar}
}\n`
  }
  output += content
  output += '\n'
  output += 'delete global.isIndependent\n'

  return output
}
