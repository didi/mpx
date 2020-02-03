// 该loader用于将用户定义的messages注入到i18n.wxs中
const getMainCompilation = require('../utils/get-main-compilation')
const loaderUtils = require('loader-utils')

module.exports = function (content) {
  const mainCompilation = getMainCompilation(this._compilation)
  const i18n = mainCompilation.__mpx__.i18n
  let prefix = ''
  if (i18n) {
    if (i18n.messages) {
      prefix += `var __mpx_messages__ = ${JSON.stringify(i18n.messages)}\n`
    } else if (i18n.messagesPath) {
      prefix += `var __mpx_messages__ = require(${loaderUtils.stringifyRequest(this, i18n.messagesPath)})\n`
    }
    if (i18n.dateTimeFormats) {
      prefix += `var __mpx_datetime_formats__ = ${JSON.stringify(i18n.dateTimeFormats)}\n`
    } else if (i18n.dateTimeFormatsPath) {
      prefix += `var __mpx_datetime_formats__ = require(${loaderUtils.stringifyRequest(this, i18n.dateTimeFormatsPath)})\n`
    }
    if (i18n.numberFormats) {
      prefix += `var __mpx_number_formats__ = ${JSON.stringify(i18n.numberFormats)}\n`
    } else if (i18n.numberFormatsPath) {
      prefix += `var __mpx_number_formats__ = require(${loaderUtils.stringifyRequest(this, i18n.numberFormatsPath)})\n`
    }
  }
  content = prefix + content
  return content
}
