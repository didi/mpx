const TAG_NAME = 'scroll-view'

module.exports = function ({ print }) {
  return {
    test: TAG_NAME,
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
