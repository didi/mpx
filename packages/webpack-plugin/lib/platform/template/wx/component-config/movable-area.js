const TAG_NAME = 'movable-area'

module.exports = function ({ print }) {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-movable-area'
    }
  }
}
