const TAG_NAME = 'radio'

module.exports = function () {
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-radio'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-radio'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-radio'
    },
    event: [
      {
        test: 'tap',
        ali () {
          // 支付宝radio上不支持tap事件，change事件的表现和tap类似所以替换
          return 'change'
        }
      }
    ]
  }
}
