const TAG_NAME = 'input'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false, type: 'event' })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: false })
  const jdEventLog = print({ platform: 'jd', tag: TAG_NAME, isError: false, type: 'event' })
  const webPropLog = print({ platform: 'web', tag: TAG_NAME, isError: false })
  const webEventLog = print({ platform: 'web', tag: TAG_NAME, isError: false, type: 'event' })
  const webValueLog = print({ platform: 'web', tag: TAG_NAME, isError: false, type: 'value' })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  const ksPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    web (tag, { el }) {
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
        test: /^(hold-keyboard)$/,
        jd: jdPropLog
      },
      {
        test: /^(placeholder-class|cursor-spacing|always-embed|cursor|selection-start|selection-end|safe-password-cert-path|safe-password-length|safe-password-time-stamp|safe-password-nonce|safe-password-salt|safe-password-custom-hash)$/,
        jd: ksPropLog
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
      },
      {
        test: /^(always-embed|bindkeyboardheightchange)$/,
        qa: qaPropLog
      }
    ],
    event: [
      {
        test: 'keyboardheightchange',
        ali: aliEventLog,
        swan: baiduEventLog,
        tt: ttEventLog,
        web: webEventLog,
        jd: jdEventLog
      },
      {
        test: 'confirm',
        web: webEventLog
      }
    ]
  }
}
