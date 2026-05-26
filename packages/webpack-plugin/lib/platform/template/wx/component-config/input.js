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
  const ksPropLog = print({ platform: 'ks', tag: TAG_NAME, isError: false })
  const ksEventLog = print({ platform: 'ks', tag: TAG_NAME, isError: false, type: 'event' })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  const iosValueLogError = print({ platform: 'ios', tag: TAG_NAME, isError: true, type: 'value' })
  const iosPropLog = print({ platform: 'ios', tag: TAG_NAME, isError: false })
  const iosEventLog = print({ platform: 'ios', tag: TAG_NAME, isError: false, type: 'event' })
  const androidValueLogError = print({ platform: 'android', tag: TAG_NAME, isError: true, type: 'value' })
  const androidPropLog = print({ platform: 'android', tag: TAG_NAME, isError: false })
  const androidEventLog = print({ platform: 'android', tag: TAG_NAME, isError: false, type: 'event' })
  const harmonyValueLogError = print({ platform: 'harmony', tag: TAG_NAME, isError: true, type: 'value' })
  const harmonyPropLog = print({ platform: 'harmony', tag: TAG_NAME, isError: false })
  const harmonyEventLog = print({ platform: 'harmony', tag: TAG_NAME, isError: false, type: 'event' })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-input'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-input'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-input'
    },
    harmony (tag, { el }) {
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
        test: /^(auto-focus|confirm-type|confirm-hold|adjust-position|hold-keyboard)$/,
        tt: ttPropLog
      },
      {
        test: /^(hold-keyboard)$/,
        jd: jdPropLog
      },
      {
        test: 'type',
        web (prop) {
          let { name, value } = prop
          if (value === 'idcard') {
            webValueLog(prop)
            value = 'text'
          }
          return {
            name,
            value
          }
        },
        ios ({ name, value }) {
          const notSupported = ['safe-password', 'nickname']
          if (notSupported.includes(value)) {
            iosValueLogError({ name, value })
          }
        },
        android ({ name, value }) {
          const notSupported = ['safe-password', 'nickname']
          if (notSupported.includes(value)) {
            androidValueLogError({ name, value })
          }
        },
        harmony ({ name, value }) {
          const notSupported = ['safe-password', 'nickname']
          if (notSupported.includes(value)) {
            harmonyValueLogError({ name, value })
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
      },
      {
        test: /^(always-embed|hold-keyboard|safe-password-.+)$/,
        ios: iosPropLog,
        android: androidPropLog,
        harmony: harmonyPropLog
      },
      {
        test: /^(cursor-spacing|always-embed|cursor|selection-start|selection-end|adjust-position|hold-keyboard|safe-password-cert-path|safe-password-length|safe-password-time-stamp|safe-password-nonce|safe-password-salt|safe-password-custom-hash|placeholder-class)$/,
        ks: ksPropLog
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
      },
      {
        test: /^(nicknamereview|onkeyboardheightchange|keyboard.+)$/,
        ios: iosEventLog,
        android: androidEventLog,
        harmony: harmonyEventLog
      },
      {
        test: /^(change|nicknamereview|selectionchange|keyboardcompositionstart|keyboardcompositionupdate|keyboardcompositionend|onkeyboardheightchange)$/,
        ks: ksEventLog
      }
    ]
  }
}
