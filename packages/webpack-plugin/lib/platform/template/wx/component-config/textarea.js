const TAG_NAME = 'textarea'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  const webPropLog = print({ platform: 'web', tag: TAG_NAME, isError: false })
  const webEventLog = print({ platform: 'web', tag: TAG_NAME, isError: false, type: 'event' })
  const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: false })
  const jdEventLog = print({ platform: 'jd', tag: TAG_NAME, isError: false, type: 'event' })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  const qaEventLog = print({ platform: 'qa', tag: TAG_NAME, isError: false, type: 'event' })
  const qqEventLog = print({ platform: 'qq', tag: TAG_NAME, isError: false, type: 'event' })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const iosValueLogError = print({ platform: 'ios', tag: TAG_NAME, isError: true, type: 'value' })
  const iosPropLog = print({ platform: 'ios', tag: TAG_NAME, isError: false })
  const iosEventLog = print({ platform: 'ios', tag: TAG_NAME, isError: false, type: 'event' })
  const androidValueLogError = print({ platform: 'android', tag: TAG_NAME, isError: true, type: 'value' })
  const androidPropLog = print({ platform: 'android', tag: TAG_NAME, isError: false })
  const androidEventLog = print({ platform: 'android', tag: TAG_NAME, isError: false, type: 'event' })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      // form全量使用内建组件
      el.isBuiltIn = true
      return 'mpx-textarea'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-textarea'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-textarea'
    },
    props: [
      {
        test: /^(auto-focus|fixed|cursor-spacing|cursor|show-confirm-bar|selection-start|selection-end|adjust-position|hold-keyboard|disable-default-padding|confirm-type)$/,
        ali: aliPropLog
      },
      {
        test: /^(hold-keyboard|disable-default-padding|confirm-type)$/,
        qq: qqPropLog,
        swan: baiduPropLog
      },
      {
        test: /^(placeholder-class|auto-focus|show-confirm-bar|adjust-position|hold-keyboard|disable-default-padding|confirm-type)$/,
        tt: ttPropLog
      },
      {
        test: /^(placeholder-style|placeholder-class|fixed|cursor-spacing|show-confirm-bar|adjust-position|hold-keyboard|auto-height)$/,
        web: webPropLog
      },
      {
        test: /^(hold-keyboard|disable-default-padding)$/,
        jd: jdPropLog
      },
      {
        test: /^(fixed|cursor-spacing|show-confirm-bar|adjust-position|hold-keyboard|auto-height)$/,
        qa: qaPropLog
      },
      {
        test: 'confirm-type',
        ios ({ name, value }) {
          const notSupported = ['return']
          if (notSupported.includes(value)) {
            iosValueLogError({ name, value })
          }
        },
        android ({ name, value }) {
          const notSupported = ['return']
          if (notSupported.includes(value)) {
            androidValueLogError({ name, value })
          }
        }
      },
      {
        test: /^(placeholder-style|placeholder-class|cursor-spacing|always-embed|hold-keyboard|disable-default-padding|adjust-keyboard-to|fixed|show-confirm-bar)$/,
        ios: iosPropLog,
        android: androidPropLog
      }
    ],
    event: [
      {
        test: /^(confirm|linechange)$/,
        web: webEventLog
      },
      {
        test: /^keyboardheightchange$/,
        ali: aliEventLog,
        jd: jdEventLog,
        qq: qqEventLog
      },
      {
        test: 'confirm',
        web: webEventLog
      },
      {
        test: 'blur|input|confirm',
        qa: qaEventLog
      },
      {
        test: /^(linechange|keyboardheightchange)$/,
        tt: ttEventLog
      },
      {
        test: /^keyboard.+$/,
        ios: iosEventLog,
        android: androidEventLog
      }
    ]
  }
}
