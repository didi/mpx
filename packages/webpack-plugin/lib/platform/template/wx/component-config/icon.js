const TAG_NAME = 'icon'

module.exports = function () {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-icon'
    }
  }
}
