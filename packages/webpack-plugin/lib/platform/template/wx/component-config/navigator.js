const { isMustache } = require('../../../../utils/string')

const TAG_NAME = 'navigator'

module.exports = function ({ print }) {
  const aliValueLogError = print({ platform: 'ali', tag: TAG_NAME, isError: true, type: 'value' })
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliPropLogError = print({ platform: 'ali', tag: TAG_NAME, isError: true })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  const webPropLog = print({ platform: 'web', tag: TAG_NAME, isError: false })
  const webEventLog = print({ platform: 'web', tag: TAG_NAME, isError: false })
  const webValueLogError = print({ platform: 'web', tag: TAG_NAME, isError: true, type: 'value' })

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
        web (attr) {
          let supportedList = ['navigate', 'redirect', 'navigateBack', 'reLaunch']
          if (supportedList.indexOf(attr.value) === -1) {
            webValueLogError(attr)
          }
        }
      },
      {
        test: /^(hover-stop-propagation)$/,
        ali: aliPropLog
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
        web: webEventLog,
        jd (eventName) {
          const eventMap = {
            'success': 'success',
            'fail': 'error',
            'complete': 'complete'
          }
          return eventMap[eventName]
        }
      }
    ]
  }
}
