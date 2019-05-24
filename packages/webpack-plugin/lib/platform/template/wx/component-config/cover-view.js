const TAG_NAME = 'cover-view'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    props: [
      {
        test: /^scroll-top$/,
        ali: aliPropLog,
        swan: baiduPropLog
      }
    ]
  }
}
