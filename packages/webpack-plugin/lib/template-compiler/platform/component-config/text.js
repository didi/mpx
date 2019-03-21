const TAG_NAME = 'text'

module.exports = function ({ warn, error }) {
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(space|decode)$/,
        ali ({ name }) {
          warn(`<${TAG_NAME}> component does not support ${name} property in ali environment!`)
        }
      }
    ]
  }
}
