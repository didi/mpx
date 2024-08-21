const TAG_NAME = 'block'

module.exports = function () {
  return {
    test: TAG_NAME,
    web () {
      return 'template'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-block'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-block'
    }
  }
}
