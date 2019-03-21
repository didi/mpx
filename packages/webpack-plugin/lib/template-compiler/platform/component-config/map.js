const TAG_NAME = 'map'

module.exports = function ({ warn, error }) {
  const ali = (isError) => (arg) => {
    const name = typeof arg === 'string' ? arg : arg.name
    const type = typeof arg === 'string' ? 'event' : 'property'
    const msg = `<${TAG_NAME}> component does not support '${name}' ${type} in ali environment!`
    isError ? error(msg) : warn(msg)
  }

  return {
    // 匹配标签名，可传递正则
    test: TAG_NAME,
    // 组件属性中的差异部分
    props: [
      {
        test: /^(subkey|enable-3D|enable-overlooking|enable-zoom|disable-scroll|enable-rotate)$/,
        ali: ali()
      },
      {
        // todo: 支付宝平台待验证此处是否可以多次传setting参数
        test: 'show-compass'
      }
    ],
    // 组件事件中的差异部分
    // 微信中基础事件有touchstart|touchmove|touchcancel|touchend|tap|longpress|longtap|transitionend|animationstart|animationiteration|animationend|touchforcechange
    // 支付宝中的基础事件有touchStart|touchMove|touchEnd|touchCancel|tap|longTap
    event: [
      {
        test: /^(markertap|callouttap|controltap|regionchange|)$/,
        ali (eventName) {
          const eventMap = {
            'markertap': 'markerTap',
            'callouttap': 'calloutTap',
            'controltap': 'controlTap',
            'regionchange': 'regionChange'
          }
          return eventMap[eventName]
        }
      },
      {
        test: /^(updated|poitap)$/,
        ali: ali(1)
      }
    ]
  }
}
