const { isMustache } = require('../../../../utils/string')

const TAG_NAME = 'button'

module.exports = function ({ print }) {
  const aliValueLogError = print({ platform: 'ali', tag: TAG_NAME, isError: true, type: 'value' })
  const aliValueLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'value' })
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const baiduValueLogError = print({ platform: 'baidu', tag: TAG_NAME, isError: true, type: 'value' })
  const baiduValueLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false, type: 'value' })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const qqEventLog = print({ platform: 'qq', tag: TAG_NAME, isError: false, type: 'event' })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const ttValueLogError = print({ platform: 'bytedance', tag: TAG_NAME, isError: true, type: 'value' })
  const ttValueLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'value' })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  const webPropLog = print({ platform: 'web', tag: TAG_NAME, isError: false })
  const webEventLog = print({ platform: 'web', tag: TAG_NAME, isError: false, type: 'event' })
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-button'
    },
    props: [
      {
        test: 'open-type',
        ali ({ name, value }) {
          if (value === 'share' || value === 'launchApp' || value === 'getAuthorize') {
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
          } else if (value === 'getUserInfo') {
            return [
              {
                name: 'open-type',
                value: 'getAuthorize'
              },
              {
                name: 'scope',
                value: 'userInfo'
              }
            ]
          } else if (isMustache(value)) {
            // 如果是个变量，报warning
            aliValueLog({ name, value })
          } else {
            aliValueLogError({ name, value })
          }
        },
        swan ({ name, value }) {
          let supportList = ['contact', 'share', 'getUserInfo', 'getPhoneNumber', 'openSetting']
          if (isMustache(value)) {
            // 如果是个变量，报warning
            baiduValueLog({ name, value })
          } else if (supportList.indexOf(value) === -1) {
            baiduValueLogError({ name, value })
          }
        },
        tt ({ name, value }) {
          if (isMustache(value)) {
            ttValueLog({ name, value })
          } else {
            let supportList = ['share', 'getPhoneNumber']
            if (supportList.indexOf(value) === -1) {
              ttValueLogError({ name, value })
            }
          }
        }
      },
      {
        test: /^(lang|session-from|send-message-title|send-message-path|send-message-img|show-message-card)$/,
        ali: aliPropLog
      },
      {
        test: /^(lang|session-from|send-message-title|send-message-path|send-message-img|show-message-card|app-parameter)$/,
        swan: baiduPropLog
      },
      {
        test: /^(session-from|send-message-title|send-message-path|send-message-img|show-message-card)$/,
        qq: qqPropLog
      },
      {
        test: /^(plain|lang|session-from|send-message-title|send-message-path|send-message-img|app-parameter|show-message-card)$/,
        tt: ttPropLog
      },
      {
        test: /^(open-type|lang|session-from|send-message-title|send-message-path|send-message-img|show-message-card|app-parameter)$/,
        web: webPropLog
      },
      {
        test: /^(size|type|plain|loading|form-type|hover-class|hover-stop-propagation|hover-start-time|hover-stay-time|use-built-in)$/,
        web (prop, { el }) {
          // todo 这部分能力基于内部封装实现
          el.isBuiltIn = true
        }
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
      },
      {
        test: /^(contact)$/,
        qq: qqEventLog
      },
      {
        test: /^(getuserinfo|contact|getphonenumbe|error|launchapp|opensetting)$/,
        tt: ttEventLog,
        web: webEventLog
      }
    ]
  }
}
