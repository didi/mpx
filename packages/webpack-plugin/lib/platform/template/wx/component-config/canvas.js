const TAG_NAME = 'canvas'

module.exports = function ({ print }) {
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: false })
  const qaEventLog = print({ platform: 'qa', tag: TAG_NAME, isError: false, type: 'event' })
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
      },
      {
        test: 'disable-scroll',
        tt: ttPropLog
      },
      {
        test: 'type',
        jd: jdPropLog
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
            'longtap': 'longTap'
          }
          return eventMap[eventName]
        },
        ks(eventName){
          const eventMap = {
            'touchstart': 'canvastouchstart',
            'touchmove': 'canvastouchmove',
            'touchend': 'canvastouchend',
            'touchcancel': 'canvastouchcancel',
            'longtap': 'canvaslongtap '
          }
          return eventMap[eventName]
        }
      },
      {
        test: /^(error)$/,
        ali: aliEventLog,
        ks(eventName){
          const eventMap = {
            'error': 'canvaserror',
          }
          return eventMap[eventName]
        }
      },
      {
        test: /^(longtap|error)$/,
        tt: ttEventLog,
        qa: qaEventLog
      }
    ]
  }
}
