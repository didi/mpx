const TAG_NAME = 'button'

module.exports = function ({ print }) {
  /**
   * @type {function(isError: (number|boolean|string)?, configOption: Object?): void} aliLog
   * @desc - 无法转换时告知用户的通用方法，接受0个或1个参数，意为是否error级别
   */
  const aliLog = print('ali', TAG_NAME)
  const baiduLog = print('baidu', TAG_NAME)

  return {
    test: TAG_NAME,
    props: [
      {
        test: 'open-type',
        ali ({ name, value }) {
          if (value === 'share' || value === 'launchApp') {
            // do nothing
          } else if (value === 'getPhoneNumber') {
            return [
              {
                name: 'open-type',
                value: 'getAuthorize'
              },
              {
                name: 'scope',
                value: 'phoneNumber'
              }
            ]
          } else {
            aliLog(1, { property: true })({ name, value })
          }
        },
        swan ({ name, value }) {
          let supportList = ['contact', 'share', 'getUserInfo', 'getPhoneNumber', 'openSetting']
          if (supportList.indexOf(value) === -1) {
            baiduLog(1, { property: true })({ name, value })
          }
        }
      },
      {
        test: /^(lang|session-from|send-message-title|send-message-path|send-message-img|show-message-card)$/,
        ali: aliLog(),
        swan: baiduLog()
      },
      {
        test: /^(app-parameter)$/,
        swan: baiduLog()
      }
    ],
    event: [
      {
        test: 'getphonenumber',
        ali () {
          return 'getAuthorize'
        }
      },
      {
        test: /^(getuserinfo|contact|error|launchapp|opensetting)$/,
        ali: aliLog()
      },
      {
        test: /^(contact|error|launchapp)$/,
        swan: baiduLog()
      }
    ]
  }
}
