const TAG_NAME = 'switch'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-switch'
    },
    tenon (tag, { el }) {
      el.isBuiltIn = true
      return 'tenon-switch'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-switch'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-switch'
    },
    props: [
      {
        test: /^type$/,
        ali: aliPropLog
      },
      {
        test: /^disabled$/,
        jd: jdPropLog
      }
    ]
  }
}
