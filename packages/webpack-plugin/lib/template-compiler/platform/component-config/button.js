const TAG_NAME = 'button'

module.exports = function ({ warn, error }) {
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(lang|session-from|send-message-title|send-message-path|send-message-img|show-message-card|app-parameter|aria-label)$/,
        ali ({ name }) {
          warn(`<${TAG_NAME}> component does not support ${name} property in ali environment!`)
        }
      }
    ],
    event: [
      {
        test: /^(getuserinfo|contact|getphonenumber|error|launchapp|opensetting)$/,
        ali (eventName) {
          warn(`<${TAG_NAME}> component does not support bind${eventName} property in ali environment!`)
        }
      }
    ]
  }
}
