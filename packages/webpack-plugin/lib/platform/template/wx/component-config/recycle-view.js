const TAG_NAME = 'recycle-view'

module.exports = function ({ print }) {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      el.isExtend = true
      return 'mpx-recycle-view'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      el.isExtend = true
      return 'mpx-recycle-view'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      el.isExtend = true
      return 'mpx-recycle-view'
    }
  }
}
