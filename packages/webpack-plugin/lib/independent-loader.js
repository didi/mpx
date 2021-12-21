const JSON5 = require('json5')
const parseComponent = require('./parser')
const createHelpers = require('./helpers')
const loaderUtils = require('loader-utils')
const parseRequest = require('./utils/parse-request')
const matchCondition = require('./utils/match-condition')
const fixUsingComponent = require('./utils/fix-using-component')
const addQuery = require('./utils/add-query')
const async = require('async')
const processJSON = require('./web/processJSON')
const processScript = require('./web/processScript')
const processStyles = require('./web/processStyles')
const processTemplate = require('./web/processTemplate')
const getJSONContent = require('./utils/get-json-content')
const normalize = require('./utils/normalize')
const getEntryName = require('./utils/get-entry-name')
const AppEntryDependency = require('./dependencies/AppEntryDependency')
const RecordResourceMapDependency = require('./dependencies/RecordResourceMapDependency')
const CommonJsVariableDependency = require('./dependencies/CommonJsVariableDependency')
const { MPX_APP_MODULE_ID } = require('./utils/const')
const path = require('path')

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
