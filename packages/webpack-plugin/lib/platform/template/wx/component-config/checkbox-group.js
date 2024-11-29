const TAG_NAME = 'checkbox-group'

module.exports = function () {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-checkbox-group'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-checkbox-group'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-checkbox-group'
    }
  }
}
