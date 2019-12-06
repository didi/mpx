const TAG_NAME = 'cover-view'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const webPropLog = print({ platform: 'web', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      if (el.hasEvent) {
        el.isBuiltIn = true
      }
      if (el.isBuiltIn) {
        return 'mpx-view'
      } else {
        return 'div'
      }
    },
    props: [
      {
        test: 'scroll-top',
        ali: aliPropLog,
        swan: baiduPropLog,
        web: webPropLog
      },
      {
        test: 'use-built-in',
        web (prop, { el }) {
          el.isBuiltIn = true
        }
      }
    ]
  }
}
