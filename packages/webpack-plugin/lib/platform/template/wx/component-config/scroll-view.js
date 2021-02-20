const TAG_NAME = 'scroll-view'

module.exports = function ({ print }) {
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false, type: 'event' })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const qaPropLog = print({ platform: 'quickapp', tag: TAG_NAME, isError: false })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const qqEventLog = print({ platform: 'qq', tag: TAG_NAME, isError: false, type: 'event' })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-scroll-view'
    },
    props: [
      {
        test: /^(enable-flex|scroll-anchorin|refresher-enabled|refresher-threshold|refresher-default-style|refresher-background|refresher-triggered|enhanced|bounces|show-scrollbar|paging-enabled|fast-deceleratio)$/,
        ali: aliPropLog,
        tt: ttPropLog,
        qq: qqPropLog,
        swan: baiduPropLog
      },
      {
        test: /^(enable-back-to-top)$/,
        swan: baiduPropLog,
        tt: ttPropLog
      },
      {
        test: /^(enable-back-to-top|enable-flex|scroll-anchoring|enhanced|bounces|show-scrollbar|paging-enabled|fast-deceleration|binddragstart|binddragging|binddragend)$/,
        qa: qaPropLog
      }
    ],
    event: [
      {
        test: /^(scrolltoupper|scrolltolower|scroll)$/,
        ali (eventName) {
          const eventMap = {
            'scrolltoupper': 'scrollToUpper',
            'scrolltolower': 'scrollToLower',
            'scroll': 'scroll'
          }
          return eventMap[eventName]
        }
      },
      {
        test: /^(dragstart|dragging|dragend|refresherpulling|refresherrefresh|refresherrestore|refresherabort)$/,
        ali: aliEventLog,
        tt: ttEventLog,
        qq: qqEventLog,
        swan: baiduEventLog
      }
    ]
  }
}
