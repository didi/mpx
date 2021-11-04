const TAG_NAME = 'cover-image'

module.exports = function ({ print }) {
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const ksPropLog = print({ platform: 'ks', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-image'
    },
    tt () {
      return 'image'
    },
    props: [
      {
        test: 'use-built-in',
        web (prop, { el }) {
          el.isBuiltIn = true
        }
      },
      {
        test:/^referrer-policy$/,
        ks:ksPropLog
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
