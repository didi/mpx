const TAG_NAME = 'text'

module.exports = function ({ print }) {
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const webPropLog = print({ platform: 'web', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { transWebMode, el }) {
      if (transWebMode === 'simple') {
        return 'span'
      } else {
        el.isBuiltIn = true
        return 'mpx-text'
      }
    },
    props: [
      {
        test: /^(decode)$/,
        swan: baiduPropLog
      },
      {
        test: /^(selectable|space|decode)$/,
        web (prop, { transWebMode }) {
          if (transWebMode === 'simple') {
            webPropLog(prop)
          }
        }
      }
    ]
  }
}
