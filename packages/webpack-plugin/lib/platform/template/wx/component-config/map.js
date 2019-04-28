const TAG_NAME = 'map'

module.exports = function ({ print }) {
  /**
   * @type {function(isError: (number|boolean|string)?): void} aliLog
   * @desc - 无法转换时告知用户的通用方法，接受0个或1个参数，意为是否error级别
   */
  const aliLog = print('ali', TAG_NAME)
  const baiduLog = print('baidu', TAG_NAME)

  return {
    // 匹配标签名，可传递正则
    test: TAG_NAME,
    // 组件属性中的差异部分
    props: [
      {
        test: /^(subkey|enable-3D|enable-overlooking|enable-zoom|disable-scroll|enable-rotate|show-compass)$/,
        ali: aliLog()
      },
      {
        test: 'subkey',
        swan: baiduLog()
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
        ali: aliLog(1)
      },
      {
        test: 'poitap',
        swan: baiduLog(1)
      }
    ]
  }
}
