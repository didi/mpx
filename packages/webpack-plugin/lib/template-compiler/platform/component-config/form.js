const TAG_NAME = 'form'

module.exports = function ({ warn, error }) {
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(report-submit-timeout)$/,
        ali ({ name }) {
          warn(`<${TAG_NAME}> component does not support ${name} property in ali environment!`)
        }
      }
    ],
    event: [
      {
        test: /^(submit|reset)$/,
        ali (eventName) {
          const eventMap = {
            'submit': 'onSubmit',
            'reset': 'onReset'
          }
          return eventMap[eventName]
        }
      }s
    ]
  }
}
