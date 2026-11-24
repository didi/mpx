const TAG_NAME = 'movable-area'

module.exports = function ({ print }) {
  const ksPropLog = print({ platform: 'ks', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-area'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-area'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-area'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-area'
    },
    props: [
      {
        test: /^(scale-area)$/,
        ks: ksPropLog
      }
    ]
  }
}
