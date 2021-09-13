const TAG_NAME = 'view'

module.exports = function ({ print }) {
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  const qaEventLogError = print({ platform: 'qa', tag: TAG_NAME, isError: false, type: 'event' })

  return {
    // 匹配标签名，可传递正则
    test: TAG_NAME,
    // 支付宝标签名转换函数，如无差异可忽略
    // ali () {
    //   return 'a:view'
    // },
    web (tag, { el }) {
      if (el.hasEvent) {
        el.isBuiltIn = true
      }
      if (el.isBuiltIn) {
        return 'mpx-view'
      } else {
        return 'div'
      }
    },
    tenon (tag, { el }) {
      el.isBuiltIn = true
      return 'tenon-view'
    },
    qa (tag) {
      return 'div'
    },
    // 组件属性中的差异部分
    props: [
      {
        test: /^(hover-(class|stop-propagation|start-time|stay-time)|use-built-in)$/,
        // 当遇到微信支持而支付宝不支持的特性时，转换函数可以只抛出错误或警告而不返回值
        web (prop, { el }) {
          el.isBuiltIn = true
        },
        qa: qaPropLog
      }
    ],
    // 组件事件中的差异部分
    // 微信中基础事件有touchstart|touchmove|touchcancel|touchend|tap|longpress|longtap|transitionend|animationstart|animationiteration|animationend|touchforcechange
    // 支付宝中的基础事件有touchStart|touchMove|touchEnd|touchCancel|tap|longTap
    // 快应用通用事件有touchstart|touchmove|touchend|touchcancel|longpress|click|focus|blur
    event: [
      {
        // 支付宝中的view组件额外支持了transitionEnd|animationStart|animationIteration|animationEnd，故在此声明了组件事件转换逻辑
        test: /^(transitionend|animationstart|animationiteration|animationend)$/,
        //
        ali (eventName) {
          const eventMap = {
            'transitionend': 'transitionEnd',
            'animationstart': 'animationStart',
            'animationiteration': 'animationIteration',
            'animationend': 'animationEnd'
          }
          return eventMap[eventName]
        },
        qa: qaEventLogError
      }
    ]
  }
}
