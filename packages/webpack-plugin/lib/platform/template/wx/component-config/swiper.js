const TAG_NAME = 'swiper'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false, type: 'event' })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  const webPropLog = print({ platform: 'web', tag: TAG_NAME, isError: false })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-swiper'
    },
    props: [
      {
        test: /^(display-multiple-items|skip-hidden-item-layout|easing-function)$/,
        ali: aliPropLog
      },
      {
        test: /^(skip-hidden-item-layout|easing-function)$/,
        swan: baiduPropLog
      },
      {
        test: /^(easing-function)$/,
        qq: qqPropLog
      },
      {
        test: /^(previous-margin|next-margin|skip-hidden-item-layout|easing-function)$/,
        tt: ttPropLog
      },
      {
        test: /^(previous-margin|next-margin|display-multiple-items|skip-hidden-item-layout)$/,
        web: webPropLog
      },
      {
        test: /^(snap-to-edge|easing-function)$/,
        qa: qaPropLog
      }
    ],
    event: [
      {
        test: /^(change)$/,
        ali (eventName) {
          const eventMap = {
            'change': 'change'
          }
          return eventMap[eventName]
        }
      },
      {
        test: /^(transition|animationfinish)$/,
        ali: aliEventLog,
        tt: ttEventLog
      },
      {
        test: /^(transition)$/,
        swan: baiduEventLog
      }
    ]
  }
}
