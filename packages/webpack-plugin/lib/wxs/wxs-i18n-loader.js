// 该loader用于将用户定义的messages注入到i18n.wxs中
const getMainCompilation = require('../utils/get-main-compilation')
const loaderUtils = require('loader-utils')

module.exports = function (content) {
  const mainCompilation = getMainCompilation(this._compilation)
  const i18n = mainCompilation.__mpx__.i18n
  let prefix = 'var messages = {}\n'
  if (i18n) {
    if (i18n.messages) {
      prefix = `var messages = ${JSON.stringify(i18n.messages)}\n`
    } else if (i18n.messagesPath) {
      prefix = `var messages = require(${loaderUtils.stringifyRequest(this, i18n.messagesPath)})\n`
    }
  }
  content = prefix + content
  return content
}
