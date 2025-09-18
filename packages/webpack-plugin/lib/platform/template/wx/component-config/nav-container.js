const TAG_NAME = 'nav-container'

module.exports = function ({ print }) {
  return {
    test: TAG_NAME,
    web(tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-nav-container'
    },
    ios(tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-nav-container'
    },
    android(tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-nav-container'
    },
    harmony(tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-nav-container'
    },
    wx(tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-nav-container'
    }
  }
}
