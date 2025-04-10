const TAG_NAME = 'picker-view'

module.exports = function ({ print }) {
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  const jdEventLog = print({ platform: 'jd', tag: TAG_NAME, isError: false, type: 'event' })
  const iosEventLog = print({ platform: 'ios', tag: TAG_NAME, isError: false, type: 'event' })
  const androidEventLog = print({ platform: 'android', tag: TAG_NAME, isError: false, type: 'event' })
  const harmonyEventLog = print({ platform: 'harmony', tag: TAG_NAME, isError: false, type: 'event' })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-picker-view'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-picker-view'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-picker-view'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-picker-view'
    },
    props: [
      {
        test: /^(indicator-class|mask-class)$/,
        tt: ttPropLog
      }
    ],
    event: [
      {
        test: /^(pickstart|pickend)$/,
        ali: aliEventLog,
        swan: baiduEventLog,
        tt: ttEventLog,
        jd: jdEventLog,
        ios: iosEventLog,
        android: androidEventLog,
        harmony: harmonyEventLog
      }
    ]
  }
}
