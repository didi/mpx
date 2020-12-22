const TAG_NAME = 'text'

module.exports = function ({ print }) {
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qaPropLog = print({ platform: 'quickapp', tag: TAG_NAME, isError: false })

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
        test: /^(decode)$/,
        swan: baiduPropLog
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
