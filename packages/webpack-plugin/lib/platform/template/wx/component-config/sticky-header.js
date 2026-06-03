const TAG_NAME = 'sticky-header'

module.exports = function ({ print }) {
  return {
    test: TAG_NAME,
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-sticky-header'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-sticky-header'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-sticky-header'
    },
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-sticky-header'
    }
  }
}
