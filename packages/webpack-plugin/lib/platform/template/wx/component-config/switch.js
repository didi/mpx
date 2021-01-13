const TAG_NAME = 'switch'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-switch'
    },
    props: [
      {
        test: /^type$/,
        ali: aliPropLog
      }
    ]
  }
}
