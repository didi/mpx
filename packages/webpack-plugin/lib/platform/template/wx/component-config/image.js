const TAG_NAME = 'image'
module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      if (el.isBuiltIn) {
        return 'mpx-image'
      } else {
        return 'img'
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
        test: /^(mode|lazy-load|show-menu-by-longpress|webp)$/,
        web (prop, { el }) {
          el.isBuiltIn = true
        }
      }
    ]
  }
}
