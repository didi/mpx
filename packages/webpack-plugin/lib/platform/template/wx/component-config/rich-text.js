const TAG_NAME = 'rich-text'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(space)$/,
        ali: aliPropLog,
        swan: baiduPropLog
      }
    ]
  }
}
