const TAG_NAME = 'cover-image'

module.exports = function ({ print }) {
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      if (el.hasEvent) {
        el.isBuiltIn = true
      }
      if (el.isBuiltIn) {
        return 'mpx-image'
      } else {
        return 'img'
      }
    },
    props: [
      {
        test: 'use-built-in',
        web (prop, { el }) {
          el.isBuiltIn = true
        }
      }
    ],
    event: [
      {
        test: /^(load|error)$/,
        ali: aliEventLog
      }
    ]
  }
}
