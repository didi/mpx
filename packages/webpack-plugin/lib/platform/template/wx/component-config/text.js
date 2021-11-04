const TAG_NAME = 'text'

module.exports = function ({ print }) {
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const ksPropLog = print({ platform: 'ks', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      if (el.hasEvent) {
        el.isBuiltIn = true
      }
      if (el.isBuiltIn) {
        return 'mpx-text'
      } else {
        return 'span'
      }
    },
    props: [
      {
        test: /^(decode|user-select)$/,
        swan: baiduPropLog
      },
      {
        test: /^(user-select)$/,
        ali: aliPropLog,
        tt: ttPropLog,
        qq: qqPropLog,
        qa: qaPropLog,
        ks: ksPropLog
      },
      {
        test: /^(selectable|space|decode|use-built-in)$/,
        web (prop, { el }) {
          el.isBuiltIn = true
        },
        qa: qaPropLog
      }
    ]
  }
}
