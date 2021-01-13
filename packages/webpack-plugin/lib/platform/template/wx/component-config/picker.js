const TAG_NAME = 'picker'

module.exports = function ({ print }) {
  const aliPropLogError = print({ platform: 'ali', tag: TAG_NAME, isError: true })
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-picker'
    },
    props: [
      {
        test: 'mode',
        ali (attr) {
          if (attr.value !== 'selector') {
            aliPropLogError(attr)
          }
          return false
        }
      },
      {
        test: /^(header-text)$/,
        tt: ttPropLog,
        swan: baiduPropLog,
        ali: aliPropLog
      }
    ],
    event: [
      {
        test: /^(cancel)$/,
        ali: aliEventLog
      }
    ]
  }
}
