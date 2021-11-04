const TAG_NAME = 'swiper'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false, type: 'event' })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const webPropLog = print({ platform: 'web', tag: TAG_NAME, isError: false })
  const jdEventLog = print({ platform: 'jd', tag: TAG_NAME, isError: false, type: 'event' })
  const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: false })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  const ksPropLog = print({ platform: 'ks', tag: TAG_NAME, isError: false })
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
        test: /^(skip-hidden-item-layout|easing-function|snap-to-edge)$/,
        swan: baiduPropLog
      },
      {
        test: /^(easing-function)$/,
        jd: jdPropLog
      },
      {
        test: /^(easing-function|snap-to-edge)$/,
        qq: qqPropLog
      },
      {
        test: /^(skip-hidden-item-layout|easing-function)$/,
        tt: ttPropLog
      },
      {
        test: /^(previous-margin|next-margin|display-multiple-items|skip-hidden-item-layout)$/,
        web: webPropLog
      },
      {
        test: /^(snap-to-edge|easing-function)$/,
        qa: qaPropLog
      },
      {
        test: /^(snap-to-edge)$/,
        ks: ksPropLog
      }
    ],
    event: [
      {
        test: /^(change|animationfinish)$/,
        ali (eventName) {
          const eventMap = {
            'change': 'change',
            'animationfinish': 'animationEnd'
          }
          return eventMap[eventName]
        }
      },
      {
        test: /^(transition)$/,
        swan: baiduEventLog,
        jd: jdEventLog
      }
    ]
  }
}
