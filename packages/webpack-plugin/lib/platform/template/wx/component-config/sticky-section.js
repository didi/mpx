const TAG_NAME = 'sticky-section'

module.exports = function ({ print }) {
  return {
    test: TAG_NAME,
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'View'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'View'
    },
    web (tag, { el }) {
      return 'div'
    }
  }
}
