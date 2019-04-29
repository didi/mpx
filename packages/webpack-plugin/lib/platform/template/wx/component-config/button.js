const TAG_NAME = 'button'

module.exports = function ({ print }) {
  const aliValueLogError = print({ platform: 'ali', tag: TAG_NAME, isError: true, type: 'value' })
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const baiduValueLogError = print({ platform: 'baidu', tag: TAG_NAME, isError: true, type: 'value' })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })

  // const baiduLog = print('baidu', TAG_NAME)

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
            aliValueLogError({ name, value })
          }
        },
        swan ({ name, value }) {
          let supportList = ['contact', 'share', 'getUserInfo', 'getPhoneNumber', 'openSetting']
          if (supportList.indexOf(value) === -1) {
            baiduValueLogError({ name, value })
          }
        }
      },
      {
        test: /^(lang|session-from|send-message-title|send-message-path|send-message-img|show-message-card)$/,
        ali: aliPropLog,
        swan: baiduPropLog
      },
      {
        test: /^(app-parameter)$/,
        swan: baiduPropLog
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
        ali: aliEventLog
      },
      {
        test: /^(contact|error|launchapp)$/,
        swan: baiduEventLog
      }
    ]
  }
}
