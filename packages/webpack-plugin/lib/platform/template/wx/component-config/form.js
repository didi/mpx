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
  const ksPropLog = print({ platform: 'ks', tag: TAG_NAME, isError: false })
  const ksEventLog = print({ platform: 'ks', tag: TAG_NAME, isError: false, type: 'event' })
  const iosEventLog = print({ platform: 'ios', tag: TAG_NAME, isError: false, type: 'event' })
  const androidEventLog = print({ platform: 'android', tag: TAG_NAME, isError: false, type: 'event' })
  const harmonyEventLog = print({ platform: 'harmony', tag: TAG_NAME, isError: false, type: 'event' })
  const webEventLog = print({ platform: 'web', tag: TAG_NAME, isError: false, type: 'event' })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const qaEventLog = print({ platform: 'qa', tag: TAG_NAME, isError: false, type: 'event' })
  const qqEventLog = print({ platform: 'qq', tag: TAG_NAME, isError: false, type: 'event' })
  const jdEventLog = print({ platform: 'jd', tag: TAG_NAME, isError: false, type: 'event' })

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
        test: /^(report-submit|report-submit-timeout|submitToGroup)$/,
        web: webPropLog,
        qa: qaPropLog,
        ios: iosPropLog,
        android: androidPropLog,
        harmony: harmonyPropLog,
        ks: ksPropLog
      }
    ],
    event: [
      {
        test: /^(submitToGroup)$/,
        ks: ksEventLog,
        ios: iosEventLog,
        android: androidEventLog,
        harmony: harmonyEventLog,
        web: webEventLog,
        ali: aliEventLog,
        qa: qaEventLog,
        qq: qqEventLog,
        jd: jdEventLog
      }
    ]
  }
}
