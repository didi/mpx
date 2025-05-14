const TAG_NAME = 'picker'

module.exports = function ({ print }) {
  const aliPropLogError = print({ platform: 'ali', tag: TAG_NAME, isError: true })
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: true })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  const iosPropLog = print({ platform: 'ios', tag: TAG_NAME, isError: false })
  const androidPropLog = print({ platform: 'android', tag: TAG_NAME, isError: false })
  const harmonyPropLog = print({ platform: 'harmony', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-picker'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-picker'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-picker'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-picker'
    },
    props: [
      {
        test: 'mode',
        ali (attr) {
          if (attr.value !== 'selector') {
            aliPropLogError(attr)
          }
          return false
        }
      },
      {
        test: /^(header-text)$/,
        tt: ttPropLog,
        swan: baiduPropLog,
        ali: aliPropLog,
        jd: jdPropLog,
        qa: qaPropLog,
        ios: iosPropLog,
        android: androidPropLog,
        harmony: harmonyPropLog
      }
    ],
    event: [
      {
        test: /^(cancel)$/,
        ali: aliEventLog
      }
    ]
  }
}
