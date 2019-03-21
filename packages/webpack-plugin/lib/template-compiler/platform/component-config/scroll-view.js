module.exports = function ({ warn, error }) {
  return {
    test: 'scroll-view',
    props: [
      {
        test: /^(aria-label)$/,
        ali ({ name }) {
          warn(`View component does not support ${name} property in ali environment!`)
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
