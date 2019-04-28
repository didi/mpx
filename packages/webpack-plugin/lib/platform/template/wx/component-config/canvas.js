const TAG_NAME = 'canvas'

module.exports = function ({ print }) {
  /**
   * @type {function(isError: (number|boolean|string)?): void} aliLog
   * @desc - 无法转换时告知用户的通用方法，接受0个或1个参数，意为是否error级别
   */
  const aliLog = print('ali', TAG_NAME)
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^canvas-id$/,
        ali ({ value }) {
          return {
            name: 'id',
            value
          }
        }
      }
    ],
    // 组件事件中的差异部分
    // 微信中基础事件有touchstart|touchmove|touchcancel|touchend|tap|longpress|longtap|transitionend|animationstart|animationiteration|animationend|touchforcechange
    // 支付宝中的基础事件有touchStart|touchMove|touchEnd|touchCancel|tap|longTap
    event: [
      {
        test: /^(touchstart|touchmove|touchend|touchcancel|longtap)$/,
        ali (eventName) {
          const eventMap = {
            'touchstart': 'touchStart',
            'touchmove': 'touchMove',
            'touchend': 'touchEnd',
            'touchcancel': 'touchCancel',
            'longtap': 'longTap',
          }
          return eventMap[eventName]
        }
      },
      {
        test: /^(error)$/,
        ali: aliLog()
      }
    ]
  }
}
