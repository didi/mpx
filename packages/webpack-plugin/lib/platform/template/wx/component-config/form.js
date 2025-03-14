const TAG_NAME = 'form'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: false })
  const webPropLog = print({ platform: 'web', tag: TAG_NAME, isError: false })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  const iosPropLog = print({ platform: 'ios', tag: TAG_NAME, isError: false })
  const androidPropLog = print({ platform: 'android', tag: TAG_NAME, isError: false })
  const harmonyPropLog = print({ platform: 'harmony', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      // form全量使用内建组件
      el.isBuiltIn = true
      return 'mpx-form'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-form'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-form'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-form'
    },
    props: [
      {
        test: /^(report-submit-timeout)$/,
        ali: aliPropLog,
        swan: baiduPropLog,
        jd: jdPropLog,
        qq: qqPropLog
      },
      {
        test: /^(report-submit|report-submit-timeout)$/,
        web: webPropLog,
        qa: qaPropLog,
        ios: iosPropLog,
        android: androidPropLog,
        harmony: harmonyPropLog
      }
    ]
  }
}
