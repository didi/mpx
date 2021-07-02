const TAG_NAME = 'map'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLogError = print({ platform: 'ali', tag: TAG_NAME, isError: true, type: 'event' })
  const aliPropValueWarningLog = print({ platform: 'ali', tag: TAG_NAME, isError: true, type: 'value-attr-uniform' })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLogError = print({ platform: 'baidu', tag: TAG_NAME, isError: true, type: 'event' })
  const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: false })
  const jdEventLogError = print({ platform: 'jd', tag: TAG_NAME, isError: true, type: 'event' })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  const qaEventLogError = print({ platform: 'qa', tag: TAG_NAME, isError: true, type: 'event' })
  return {
    // 匹配标签名，可传递正则
    test: TAG_NAME,
    // 组件属性中的差异部分
    props: [
      {
        test: /^(min-scale|max-scale|covers|subkey|layer-style|rotate|skew|enable-3D|show-compass|show-scale|enable-overlooking|enable-zoom|enable-scroll|enable-rotate|enable-satellite|enable-traffic|enable-poi|enable-building)$/,
        ali: aliPropLog
      },
      {
        test: /^polygons$/,
        ali ({ name, value }) {
          name = 'polygon'
          // TODO 标签的属性名不一致，后续考虑通过wxs注入的方式实现转换
          aliPropValueWarningLog()
          return { name, value }
        }
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
      },
      {
        test: /^(min-scale|max-scale|polyline|controls|polygons|subkey|layer-style|rotate|skew|enable-3D|show-compass|show-scale|enable-overlooking|enable-zoom|enable-scroll|enable-rotate|enable-satellite|enable-traffic|enable-poi|enable-building|setting)$/,
        tt: ttPropLog
      },
      {
        test: /^(min-scale|max-scale|covers|polyline|include-points|show-location|subkey|layer-style|skew|enable-3D|show-compass|show-scale|enable-overlooking|enable-zoom|enable-scroll|enable-rotate|enable-satellite|enable-traffic|enable-poi|enable-building|setting)$/,
        qa: qaPropLog
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
        test: /^(updated|poitap|anchorpointtap)$/,
        ali: aliEventLogError
      },
      {
        test: 'poitap',
        swan: baiduEventLogError
      },
      {
        test: /^(labeltap|updated|poitap)$/,
        jd: jdEventLogError
      },
      {
        test: /^(labeltap|controltap|updated|regionchange|poitap|anchorpointtap)$/,
        tt: ttEventLog
      },
      {
        test: /^(labeltap|anchorpointtap)$/,
        qa: qaEventLogError
      }
    ]
  }
}
