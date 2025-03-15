const TAG_NAME = 'root-portal'

module.exports = function ({ print }) {
  return {
    test: TAG_NAME,
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-root-portal'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-root-portal'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-root-portal'
    }
  }
}
