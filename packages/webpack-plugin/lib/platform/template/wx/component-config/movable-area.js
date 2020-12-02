const TAG_NAME = 'movable-area'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-area'
    },
    props: [
      {
        test: /^(scale-area)$/,
        ali: aliPropLog
      }
    ]
  }
}
