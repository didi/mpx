const TAG_NAME = 'checkbox'

module.exports = function () {
  return {
    test: TAG_NAME,
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
