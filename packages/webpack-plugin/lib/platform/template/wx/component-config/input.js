const TAG_NAME = 'input'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false, type: 'event' })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  const webPropLog = print({ platform: 'web', tag: TAG_NAME, isError: false })
  const webEventLog = print({ platform: 'web', tag: TAG_NAME, isError: false, type: 'event' })
  const webValueLog = print({ platform: 'web', tag: TAG_NAME, isError: false, type: 'value' })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-input'
    },
    qa (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-input'
    },
    props: [
      {
        test: /^(cursor-spacing|auto-focus|adjust-position|hold-keyboard)$/,
        ali: aliPropLog
      },
      {
        test: /^(auto-focus|hold-keyboard)$/,
        swan: baiduPropLog
      },
      {
        test: /^(placeholder-class|auto-focus|confirm-type|confirm-hold|adjust-position|hold-keyboard)$/,
        tt: ttPropLog
      },
      {
        test: 'type',
        web (prop) {
          let { name, value } = prop
          if (value === 'idcard' || value === 'digit') {
            webValueLog(prop)
            value = 'text'
          }
          return {
            name,
            value
          }
        }
      },
      {
        test: /^(password|auto-focus|focus|cursor|selection-start|selection-end|use-built-in)$/,
        web (prop, { el }) {
          el.isBuiltIn = true
        }
      },
      {
        test: /^(placeholder-style|placeholder-class|cursor-spacing|confirm-type|confirm-hold|adjust-position|hold-keyboard)$/,
        web: webPropLog
      }
    ],
    event: [
      {
        test: 'keyboardheightchange',
        ali: aliEventLog,
        swan: baiduEventLog,
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
