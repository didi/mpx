const TAG_NAME = 'swiper'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(display-multiple-items|skip-hidden-item-layout|easing-function)$/,
        ali: aliPropLog
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
      }
    ]
  }
}
