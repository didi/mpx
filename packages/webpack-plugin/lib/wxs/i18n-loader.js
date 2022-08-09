// 该loader用于将用户定义的messages注入到i18n.wxs中
const loaderUtils = require('loader-utils')

module.exports = function (content) {
  const i18n = this.getMpx().i18n
  let prefix = 'var __mpx_messages__, __mpx_locale__, __mpx_fallback_locale__\n'
  if (i18n) {
    if (i18n.messages) {
      prefix += `__mpx_messages__ = ${JSON.stringify(i18n.messages)}\n`
    } else if (i18n.messagesPath) {
      prefix += `__mpx_messages__ = require(${loaderUtils.stringifyRequest(this, i18n.messagesPath)})\n`
    }
    if (i18n.locale) {
      prefix += `__mpx_locale__ = ${JSON.stringify(i18n.locale)}\n`
    }
    if (i18n.fallbackLocale) {
      prefix += `__mpx_fallback_locale__ = ${JSON.stringify(i18n.fallbackLocale)}\n`
    }
  }
  content = prefix + content
  return content
}
