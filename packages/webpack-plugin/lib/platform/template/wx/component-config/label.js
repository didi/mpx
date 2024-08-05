const TAG_NAME = 'label'

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
    }
  }
}
