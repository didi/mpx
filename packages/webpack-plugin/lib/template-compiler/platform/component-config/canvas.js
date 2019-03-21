const TAG_NAME = 'canvas'

module.exports = function ({ warn, error }) {
  return {
    // 匹配标签名，可传递正则
    test: TAG_NAME,
    // 组件属性中的差异部分
    props: [
      {
        test: /^canvas-id$/,
        ali () {
          return 'id'
        }
      },
      {
        test: /^(disable-scroll)$/,
        ali ({ name }) {
          warn(`<${TAG_NAME}> component does not support '${name}' property in ali environment!`)
        }
      }
    ],
    // 组件事件中的差异部分
    // 微信中基础事件有touchstart|touchmove|touchcancel|touchend|tap|longpress|longtap|transitionend|animationstart|animationiteration|animationend|touchforcechange
    // 支付宝中的基础事件有touchStart|touchMove|touchEnd|touchCancel|tap|longTap
    event: [
      {
        test: /^(error)$/,
        ali (eventName) {
          warn(`${TAG_NAME} not support ${eventName} event in ali environment!`)
        }
      }
    ]
  }
}
