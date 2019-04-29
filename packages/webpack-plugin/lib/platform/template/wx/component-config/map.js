const TAG_NAME = 'map'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLogError = print({ platform: 'ali', tag: TAG_NAME, isError: true, type: 'event' })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLogError = print({ platform: 'baidu', tag: TAG_NAME, isError: true, type: 'event' })

  return {
    // 匹配标签名，可传递正则
    test: TAG_NAME,
    // 组件属性中的差异部分
    props: [
      {
        test: /^(covers|subkey|enable-3D|show-compass|enable-overlooking|enable-zoom|disable-scroll|enable-rotate)$/,
        ali: aliPropLog
      },
      {
        test: 'subkey',
        swan: baiduPropLog
      }
    ],
    // 组件事件中的差异部分
    // 微信中基础事件有touchstart|touchmove|touchcancel|touchend|tap|longpress|longtap|transitionend|animationstart|animationiteration|animationend|touchforcechange
    // 支付宝中的基础事件有touchStart|touchMove|touchEnd|touchCancel|tap|longTap
    event: [
      {
        test: /^(tap|markertap|callouttap|controltap|regionchange|)$/,
        ali (eventName) {
          const eventMap = {
            'tap': 'tap',
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
        ali: aliEventLogError
      },
      {
        test: 'poitap',
        swan: baiduEventLogError
      }
    ]
  }
}
