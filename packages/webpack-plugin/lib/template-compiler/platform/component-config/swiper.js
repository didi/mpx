const TAG_NAME = 'swiper'

module.exports = function ({ warn, error }) {
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(current-item-id|display-multiple-items|skip-hidden-item-layout)$/,
        ali ({ name }) {
          warn(`<${TAG_NAME}> component does not support ${name} property in ali environment!`)
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
          warn(`<${TAG_NAME}> component does not support bind${eventName} property in ali environment!`)
        }
      }
    ]
  }
}
