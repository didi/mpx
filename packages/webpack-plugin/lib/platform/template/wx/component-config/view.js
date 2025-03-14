const TAG_NAME = 'view'

module.exports = function ({ print }) {
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  const qaEventLogError = print({ platform: 'qa', tag: TAG_NAME, isError: false, type: 'event' })
  const iosPropLog = print({ platform: 'ios', tag: TAG_NAME, isError: false })
  const androidPropLog = print({ platform: 'android', tag: TAG_NAME, isError: false })
  const harmonyPropLog = print({ platform: 'harmony', tag: TAG_NAME, isError: false })

  return {
    // 匹配标签名，可传递正则
    test: TAG_NAME,
    // 支付宝标签名转换函数，如无差异可忽略
    // ali () {
    //   return 'a:view'
    // },
    web (tag, { el }) {
      if (el.hasModel) {
        el.isBuiltIn = true
      }
      if (el.isBuiltIn) {
        return 'mpx-view'
      } else {
        return 'div'
      }
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-view'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-view'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-view'
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
      }, {
        test: /^(hover-stop-propagation)$/,
        android: androidPropLog,
        ios: iosPropLog,
        harmony: harmonyPropLog
      }
    ],
    // 组件事件中的差异部分
    // 微信中基础事件有touchstart|touchmove|touchcancel|touchend|tap|longpress|longtap|transitionend|animationstart|animationiteration|animationend|touchforcechange
    // 支付宝中的基础事件有touchStart|touchMove|touchEnd|touchCancel|tap|longTap
    // 快应用通用事件有touchstart|touchmove|touchend|touchcancel|longpress|click|focus|blur
    event: [
      {
        test: /^(transitionend|animationstart|animationiteration|animationend)$/,
        qa: qaEventLogError
      }
    ]
  }
}
