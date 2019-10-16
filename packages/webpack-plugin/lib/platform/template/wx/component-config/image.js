const TAG_NAME = 'image'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const webPropLog = print({ platform: 'web', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { transWebMode, el }) {
      if (transWebMode === 'simple') {
        return 'img'
      } else {
        el.isBuiltIn = true
        return 'mpx-image'
      }
    },
    props: [
      {
        test: /^show-menu-by-longpress$/,
        ali: aliPropLog,
        swan: baiduPropLog,
        qq: qqPropLog,
        tt: ttPropLog
      },
      {
        test: /^(mode|lazy-load|show-menu-by-longpress)$/,
        web (prop, { transWebMode }) {
          if (transWebMode === 'simple') {
            webPropLog(prop)
          }
        }
      }
    ]
  }
}
