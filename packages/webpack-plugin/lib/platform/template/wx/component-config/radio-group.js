const TAG_NAME = 'radio-group'

module.exports = function () {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-radio-group'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-radio-group'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-radio-group'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-radio-group'
    }
  }
}
