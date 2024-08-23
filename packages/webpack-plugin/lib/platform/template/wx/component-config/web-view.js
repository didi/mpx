const TAG_NAME = 'web-view'

module.exports = function () {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-web-view'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-web-view'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-web-view'
    }
  }
}
