const TAG_NAME = 'cover-image'

module.exports = function ({ warn, error }) {
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(scroll-top|aria-label|aria-role)$/,
        ali ({ name }) {
          warn(`<${TAG_NAME}> component does not support ${name} property in ali environment!`)
        }
      }
    ],
    event: [
      {
        test: /^(load|error)$/,
        ali (eventName) {
          warn(`<${TAG_NAME}> component does not support bind${eventName} property in ali environment!`)
        }
      }
    ]
  }
}
