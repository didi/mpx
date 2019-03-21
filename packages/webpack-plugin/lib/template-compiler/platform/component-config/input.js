const TAG_NAME = 'input'

module.exports = function ({ warn, error }) {
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(cursor-spacing|auto-focus|adjust-position|aria-label)$/,
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
