const TAG_NAME = 'movable-area'

module.exports = function ({ print }) {
  // const androidEventLog = print({ platform: 'android', tag: TAG_NAME, isError: false, type: 'event' })
  // const androidPropLog = print({ platform: 'android', tag: TAG_NAME, isError: false })
  // const iosEventLog = print({ platform: 'ios', tag: TAG_NAME, isError: false, type: 'event' })
  // const iosPropLog = print({ platform: 'ios', tag: TAG_NAME, isError: false })
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
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-area'
    }
  }
}
