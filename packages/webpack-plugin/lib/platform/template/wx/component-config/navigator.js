const { isMustache } = require('../../../../utils/string')

const TAG_NAME = 'navigator'

// 微信支持的属性及其值
const wxSupportPropsValue = {
  'open-type': ['navigate', 'redirect', 'switchTab', 'reLaunch', 'navigateBack', 'exit']
}

module.exports = function ({ print }) {
  const aliValueLogError = print({ platform: 'ali', tag: TAG_NAME, isError: true, type: 'value' })
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliPropLogError = print({ platform: 'ali', tag: TAG_NAME, isError: true })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const ttValueLogError = print({ platform: 'bytedance', tag: TAG_NAME, isError: true, type: 'value' })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  const webPropLog = print({ platform: 'web', tag: TAG_NAME, isError: false })
  const webEventLog = print({ platform: 'web', tag: TAG_NAME, isError: false })
  const webValueLogError = print({ platform: 'web', tag: TAG_NAME, isError: true, type: 'value' })
  const wxPropValueLog = print({ platform: 'wx', tag: TAG_NAME, isError: false, type: 'value' })
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-navigator'
    },
    props: [
      {
        test: /^(target|delta|app-id|path|extra-data|version|hover-stop-propagation)$/,
        ali: aliPropLogError
      },
      {
        test: 'open-type',
        ali (attr) {
          if (wxSupportPropsValue[attr.name] && wxSupportPropsValue[attr.name].indexOf(attr.value) === -1) {
            wxPropValueLog({ name: attr.name, value: attr.value })
          }
          if (isMustache(attr.value)) {
            // 如果是个变量，报warning~
            aliPropLog(attr)
          } else {
            let supportedList = ['navigate', 'redirect', 'switchTab', 'navigateBack', 'reLaunch']
            if (supportedList.indexOf(attr.value) === -1) {
              aliValueLogError(attr)
            }
          }
        },
        tt (attr) {
          if (wxSupportPropsValue[attr.name] && wxSupportPropsValue[attr.name].indexOf(attr.value) === -1) {
            wxPropValueLog({ name: attr.name, value: attr.value })
          }
          if (isMustache(attr.value)) {
            // 如果是个变量，报warning~
            ttPropLog(attr)
          } else {
            let supportedList = ['navigate', 'redirect', 'switchTab', 'navigateBack', 'reLaunch']
            if (supportedList.indexOf(attr.value) === -1) {
              ttValueLogError(attr)
            }
          }
        },
        web (attr) {
          let supportedList = ['navigate', 'redirect', 'navigateBack', 'reLaunch']
          if (supportedList.indexOf(attr.value) === -1) {
            webValueLogError(attr)
          }
        }
      },
      {
        test: /^(target|app-id|path|extra-data|version)$/,
        tt: ttPropLog
      },
      {
        test: /^(target|app-id|path|extra-data|version)$/,
        web: webPropLog
      }
    ],
    event: [
      {
        test: /^(success|fail|complete)$/,
        ali: aliEventLog,
        tt: ttEventLog,
        web: webEventLog
      }
    ]
  }
}
