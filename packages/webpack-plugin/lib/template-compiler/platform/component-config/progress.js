const TAG_NAME = 'progress'

module.exports = function ({ warn, error }) {
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(border-radius|font-size|color|active-mode|aria-label)$/,
        ali ({ name }) {
          warn(`<${TAG_NAME}> component does not support ${name} property in ali environment!`)
        }
      }
    ],
    event: [
      {
        test: /^(activeend)$/,
        ali (eventName) {
            warn(`<${TAG_NAME}> component does not support bind${eventName} property in ali environment!`)
        }
      }
    ]
  }
}
