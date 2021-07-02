const { isMustache } = require('../../../../utils/string')

const TAG_NAME = 'button'

// 微信支持的属性及其值
const wxSupportPropsValue = {
  'open-type': ['contact', 'share', 'getPhoneNumber', 'getUserInfo', 'launchApp', 'openSetting', 'feedback']
}

module.exports = function ({ print }) {
  const aliValueLogError = print({ platform: 'ali', tag: TAG_NAME, isError: true, type: 'value' })
  const aliValueLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'value' })
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const baiduValueLogError = print({ platform: 'baidu', tag: TAG_NAME, isError: true, type: 'value' })
  const baiduValueLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false, type: 'value' })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qqValueLogError = print({ platform: 'qq', tag: TAG_NAME, isError: true, type: 'value' })
  const qqValueLog = print({ platform: 'qq', tag: TAG_NAME, isError: false, type: 'value' })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const qqEventLog = print({ platform: 'qq', tag: TAG_NAME, isError: false, type: 'event' })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const ttValueLogError = print({ platform: 'bytedance', tag: TAG_NAME, isError: true, type: 'value' })
  const ttValueLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'value' })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  const webPropLog = print({ platform: 'web', tag: TAG_NAME, isError: false })
  const webEventLog = print({ platform: 'web', tag: TAG_NAME, isError: false, type: 'event' })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  const wxPropValueLog = print({ platform: 'wx', tag: TAG_NAME, isError: false, type: 'value' })

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
          const notSupported = ['contact', 'launchApp', 'openSetting', 'feedback']
          if (notSupported.indexOf(value) > -1) {
            aliValueLogError({ name, value })
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
          }
        },
        swan ({ name, value }) {
          const supportList = ['contact', 'share', 'getUserInfo', 'getPhoneNumber', 'openSetting', 'chooseAddress', 'chooseInvoiceTitle', 'login']
          if (wxSupportPropsValue[name] && wxSupportPropsValue[name].indexOf(value) === -1) {
            wxPropValueLog({ name, value })
          }
          if (isMustache(value)) {
            // 如果是个变量，报warning
            baiduValueLog({ name, value })
          } else if (supportList.indexOf(value) === -1) {
            baiduValueLogError({ name, value })
          }
        },
        qq ({ name, value }) {
          const supportList = ['share', 'getUserInfo', 'getPhoneNumber', 'launchApp', 'openSetting', 'contact', 'feedback', 'openGroupProfile', 'addFriend', 'addColorSign', 'openPublicProfile', 'addGroupApp', 'shareMessageToFriend', 'addToFavorites']
          if (wxSupportPropsValue[name] && wxSupportPropsValue[name].indexOf(value) === -1) {
            wxPropValueLog({ name, value })
          }
          if (isMustache(value)) {
            // 如果是个变量，报warning
            qqValueLog({ name, value })
          } else if (supportList.indexOf(value) === -1) {
            qqValueLogError({ name, value })
          }
        },
        tt ({ name, value }) {
          if (wxSupportPropsValue[name] && wxSupportPropsValue[name].indexOf(value) === -1) {
            wxPropValueLog({ name, value })
          }
          if (isMustache(value)) {
            ttValueLog({ name, value })
          } else {
            const supportList = ['share', 'getPhoneNumber', 'contact']
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
      },
      {
        test: /^(open-type|lang|session-from|send-message-title|send-message-path|send-message-img|app-parameter|show-message-card|bindgetuserinfo|bindcontact|bindgetphonenumber|binderror|bindopensetting|bindlaunchapp)$/,
        qa: qaPropLog
      }
    ],
    event: [
      {
        test: /^(getphonenumber|getuserinfo)$/,
        ali () {
          return 'getAuthorize'
        }
      },
      {
        test: /^(contact|launchapp|opensetting)$/,
        ali: aliEventLog
      },
      {
        test: /^(error|launchapp)$/,
        swan: baiduEventLog
      },
      {
        test: /^(getphonenumber)$/,
        qq: qqEventLog
      },
      {
        test: /^(getuserinfo|contact|error|launchapp|opensetting)$/,
        tt: ttEventLog
      },
      {
        test: /^(getuserinfo|contact|error|launchapp|opensetting|getphonenumber)$/,
        web: webEventLog
      }
    ]
  }
}
