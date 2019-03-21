module.exports = function ({ warn, error }) {
  return {
    test: 'swiper',
    props: [
      {
        test: /^(current-item-id|display-multiple-items|skip-hidden-item-layout)$/,
        ali ({ name }) {
          warn(`View component does not support ${name} property in ali environment!`)
        }
      }
    ],
    event: [
      {
        test: /^(change)$/,
        ali (eventName) {
          const eventMap = {
            'change': 'onchange'
          }
          return eventMap[eventName]
        }
      },
      {
        test: /^(transition|animationfinish)$/,
        ali (eventName) {
          warn(`View component does not support ${'bind' + eventName} property in ali environment!`)
        }
      }
    ]
  }
}
