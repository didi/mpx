const TAG_NAME = 'text'

module.exports = function ({ print }) {
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
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
        test: /^(selectable|space|decode)$/,
        web (prop, { el }) {
          el.isBuiltIn = true
        }
      }
    ]
  }
}
