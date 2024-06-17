const TAG_NAME = 'movable-view'

module.exports = function ({ print }) {
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  // const androidEventLog = print({ platform: 'android', tag: TAG_NAME, isError: false, type: 'event' })
  // const androidPropLog = print({ platform: 'android', tag: TAG_NAME, isError: false })
  // const iosEventLog = print({ platform: 'ios', tag: TAG_NAME, isError: false, type: 'event' })
  // const iosPropLog = print({ platform: 'ios', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-view'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-view'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-view'
    },
    props: [
      {
        test: /^(out-of-bounds)$/,
        ali: qaPropLog
      }
    ],
    event: [
      {
        test: /^(htouchmove|vtouchmove)$/,
        ali: aliEventLog
      }
    ]
  }
}
