export default function i18nMixin () {
  if (global.i18n) {
    return {
      data: {
        mpxLocale: global.i18n.locale || 'zh-CN'
      }
    }
  }
}
