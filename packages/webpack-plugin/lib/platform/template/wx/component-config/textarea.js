const TAG_NAME = 'textarea'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  const webPropLog = print({ platform: 'web', tag: TAG_NAME, isError: false })
  const webEventLog = print({ platform: 'web', tag: TAG_NAME, isError: false, type: 'event' })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      // form全量使用内建组件
      el.isBuiltIn = true
      return 'mpx-textarea'
    },
    props: [
      {
        test: /^(auto-focus|fixed|cursor-spacing|cursor|show-confirm-bar|selection-start|selection-end|adjust-position)$/,
        ali: aliPropLog
      },
      {
        test: /^(placeholder-class|auto-focus|show-confirm-bar|adjust-position)$/,
        tt: ttPropLog
      },
      {
        test: /^(placeholder-style|placeholder-class|fixed|cursor-spacing|show-confirm-bar|adjust-position|hold-keyboard)$/,
        web: webPropLog
      }
    ],
    event: [
      {
        test: /^(focus|blur|input|confirm)$/,
        ali (eventName) {
          const eventMap = {
            'blur': 'blur',
            'focus': 'focus',
            'input': 'input',
            'confirm': 'confirm'
          }
          return eventMap[eventName]
        }
      },
      {
        test: 'linechange',
        ali: aliEventLog,
        tt: ttEventLog,
        web: webEventLog
      },
      {
        test: 'confirm',
        web: webEventLog
      }
    ]
  }
}
