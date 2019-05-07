const TAG_NAME = 'swiper'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false, type: 'event' })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
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
        ali: aliEventLog
      },
      {
        test: /^(transition)$/,
        swan: baiduEventLog
      }
    ]
  }
}
