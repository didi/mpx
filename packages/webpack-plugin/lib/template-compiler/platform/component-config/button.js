const TAG_NAME = 'button'

module.exports = function ({ print }) {
  /**
   * @type {function(isError: (number|boolean|string)?): void} aliLog
   * @desc - 无法转换时告知用户的通用方法，接受0个或1个参数，意为是否error级别
   */
  const aliLog = print('ali', TAG_NAME)
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(lang|session-from|send-message-title|send-message-path|send-message-img|show-message-card|app-parameter|aria-label)$/,
        ali: aliLog()
      },
      {
        test: /^(open-type)$/,
        ali ({ name }) {
          error(`<${TAG_NAME}> component support ${name} property in different way in ali environment!`)
        }
      }
    ],
    event: [
      {
        test: /^(getuserinfo|contact|getphonenumber|error|launchapp|opensetting)$/,
        ali: aliLog()
      }
    ]
  }
}
