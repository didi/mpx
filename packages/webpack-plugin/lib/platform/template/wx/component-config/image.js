const TAG_NAME = 'image'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    props: [
      {
        test: /^show-menu-by-longpress$/,
        ali: aliPropLog,
        swan: baiduPropLog,
        qq: qqPropLog,
        tt: ttPropLog
      }
    ],
    event: [
      {
        test: /^(error|load)$/,
        ali (eventName) {
          return eventName
        }
      }
    ]
  }
}
