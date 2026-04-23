const TAG_NAME = 'section-list'

module.exports = function () {
  return {
    test: TAG_NAME,
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-section-list'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-section-list'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-section-list'
    }
  }
}
