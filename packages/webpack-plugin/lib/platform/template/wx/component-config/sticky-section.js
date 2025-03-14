const TAG_NAME = 'sticky-section'

module.exports = function ({ print }) {
  return {
    test: TAG_NAME,
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-sticky-section'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-sticky-section'
    },
    web (tag, { el }) {
      return 'div'
    }
  }
}
