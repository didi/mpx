const TAG_NAME = 'checkbox'

module.exports = function () {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-checkbox'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-checkbox'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-checkbox'
    },
    event: [
      {
        test: 'tap',
        ali () {
          // 支付宝checkbox上不支持tap事件，change事件的表现和tap类似所以替换
          return 'change'
        }
      }
    ]
  }
}
