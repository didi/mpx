const TAG_NAME = 'scroll-view'

module.exports = function ({ warn, error }) {
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(aria-label)$/,
        ali ({ name }) {
          warn(`<${TAG_NAME}> component does not support ${name} property in ali environment!`)
        }
      }
    ],
    event: [
      {
        test: /^(scrolltoupper|scrolltolower|scroll)$/,
        ali (eventName) {
          const eventMap = {
            'scrolltoupper': 'onScrollToUpper',
            'scrolltolower': 'onScrollToLower',
            'scroll': 'onScroll'
          }
          return eventMap[eventName]
        }
      }
    ]
  }
}
