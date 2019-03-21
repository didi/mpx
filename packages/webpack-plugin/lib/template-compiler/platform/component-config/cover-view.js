const TAG_NAME = 'cover-view'

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
    ]
  }
}
