const TAG_NAME = 'page-container'

module.exports = function ({ print }) {
  return {
    test: TAG_NAME,
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-page-container'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-page-container'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-page-container'
    }
  }
}
