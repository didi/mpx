const TAG_NAME = 'cover-image'

module.exports = function ({ print }) {
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const iosPropLog = print({ platform: 'ios', tag: TAG_NAME, isError: false })
  const androidPropLog = print({ platform: 'android', tag: TAG_NAME, isError: false })
  const harmonyPropLog = print({ platform: 'harmony', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-image'
    },
    tt () {
      return 'image'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-image'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-image'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-image'
    },
    props: [
      {
        test: 'use-built-in',
        web (prop, { el }) {
          el.isBuiltIn = true
        }
      },
      {
        test: /^(referrer-policy)$/,
        ios: iosPropLog,
        android: androidPropLog,
        harmony: harmonyPropLog
      }
    ],
    event: [
      {
        test: /^(load|error)$/,
        ali: aliEventLog
      }
    ]
  }
}
