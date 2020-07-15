const TAG_NAME = 'map'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLogError = print({ platform: 'ali', tag: TAG_NAME, isError: true, type: 'event' })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLogError = print({ platform: 'baidu', tag: TAG_NAME, isError: true, type: 'event' })
  const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: false })
  const jdEventLogError = print({ platform: 'jd', tag: TAG_NAME, isError: true, type: 'event' })

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
      },
      {
        test: /^(covers|polygons|subkey|layer-style|rotate|skew|enable-3D|show-compass|show-scale|enable-overlooking|enable-zoom|enable-scroll|enable-rotate|enable-satellite|enable-traffic|setting)$/,
        jd: jdPropLog
      },
      {
        test: /^(include-points|show-location)$/,
        jd ({ name, value }) {
          const propsMap = {
            'include-points': 'includePoints',
            'show-location': 'showLocation'
          }
          return propsMap[name]
        }
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
      },
      {
        test: /^(labeltap|updated|poitap)$/,
        jd: jdEventLogError
      }
    ]
  }
}
