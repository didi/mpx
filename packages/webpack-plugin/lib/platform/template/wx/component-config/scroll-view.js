const TAG_NAME = 'scroll-view'

module.exports = function ({ print }) {
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-scroll-view'
    },
    props: [
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
      }
    ]
  }
}
