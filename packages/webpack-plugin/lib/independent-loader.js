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
    this._module.addDependency(new CommonJsVariableDependency(i18nWxsRequest))
    // 避免该模块被concatenate导致注入的i18n没有最先执行
    this._module.buildInfo.moduleConcatenationBailout = 'i18n'
  }
  output += content
  output += '\n'
  output += 'delete global.isIndependent\n'

  return output
}
