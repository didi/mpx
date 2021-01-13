const TAG_NAME = 'textarea'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  const webPropLog = print({ platform: 'web', tag: TAG_NAME, isError: false })
  const webEventLog = print({ platform: 'web', tag: TAG_NAME, isError: false, type: 'event' })
  const qqEventLog = print({ platform: 'qq', tag: TAG_NAME, isError: false, type: 'event' })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      // form全量使用内建组件
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
        qq: qqEventLog
      },
      {
        test: /^(linechange|keyboardheightchange)$/,
        tt: ttEventLog
      }
    ]
  }
}
