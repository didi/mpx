const TAG_NAME = 'label'
const ksPropLog = print({ platform: 'ks', tag: TAG_NAME, isError: false })

module.exports = function () {
  return {
    test: TAG_NAME,
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-label'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-label'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-label'
    },
    props: [
      {
        test: /^(for)$/,
        ks: ksPropLog
      }
    ]
  }
}
