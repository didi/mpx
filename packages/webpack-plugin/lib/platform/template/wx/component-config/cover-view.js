const TAG_NAME = 'cover-view'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const baiduValueLogError = print({ platform: 'baidu', tag: TAG_NAME, isError: true, type: 'value' })
  const webPropLog = print({ platform: 'web', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      if (el.hasModel) {
        el.isBuiltIn = true
      }
      if (el.isBuiltIn) {
        return 'mpx-view'
      } else {
        return 'div'
      }
    },
    tt () {
      return 'view'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-view'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-view'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-view'
    },
    props: [
      {
        test: 'scroll-top',
        ali: aliPropLog,
        swan ({ name, value }) {
          if (typeof value === 'string') {
            baiduValueLogError({ name, value })
          }
        },
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
