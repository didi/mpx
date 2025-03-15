const TAG_NAME = 'movable-area'

module.exports = function ({ print }) {
  const androidPropLog = print({ platform: 'android', tag: TAG_NAME, isError: false })
  const harmonyPropLog = print({ platform: 'harmony', tag: TAG_NAME, isError: false })
  const iosPropLog = print({ platform: 'ios', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-area'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-area'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-area'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-area'
    },
    props: [
      {
        test: /^(scale-area)$/,
        ios: iosPropLog,
        android: androidPropLog,
        harmony: harmonyPropLog
      }
    ]
  }
}
