// 该loader用于将用户定义的messages注入到i18n.wxs中
const loaderUtils = require('loader-utils')

module.exports = function (content) {
  const i18n = this.getMpx().i18n
  let prefix = 'var __mpx_messages__, __mpx_datetime_formats__, __mpx_number_formats__\n'
  if (i18n) {
    if (i18n.messages) {
      prefix += `__mpx_messages__ = ${JSON.stringify(i18n.messages)}\n`
    } else if (i18n.messagesPath) {
      prefix += `__mpx_messages__ = require(${loaderUtils.stringifyRequest(this, i18n.messagesPath)})\n`
    }
    if (i18n.dateTimeFormats) {
      prefix += `__mpx_datetime_formats__ = ${JSON.stringify(i18n.dateTimeFormats)}\n`
    } else if (i18n.dateTimeFormatsPath) {
      prefix += `__mpx_datetime_formats__ = require(${loaderUtils.stringifyRequest(this, i18n.dateTimeFormatsPath)})\n`
    }
    if (i18n.numberFormats) {
      prefix += `__mpx_number_formats__ = ${JSON.stringify(i18n.numberFormats)}\n`
    } else if (i18n.numberFormatsPath) {
      prefix += `__mpx_number_formats__ = require(${loaderUtils.stringifyRequest(this, i18n.numberFormatsPath)})\n`
    }
  }
  content = prefix + content
  return content
}
