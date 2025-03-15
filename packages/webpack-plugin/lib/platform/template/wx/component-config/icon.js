const TAG_NAME = 'icon'

module.exports = function () {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-icon'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-icon'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-icon'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-icon'
    }
  }
}
