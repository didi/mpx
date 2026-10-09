const TAG_NAME = 'page-container'

module.exports = function () {
  return {
    test: TAG_NAME,
    // 支付宝保留事件名转换，RN 平台继续将组件映射为内建实现。
    event: [
      {
        test: 'beforeleave',
        ali () {
          return 'beforeLeave'
        }
      }
    ],
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-page-container'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-page-container'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-page-container'
    }
  }
}
