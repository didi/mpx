const { isMustache } = require('../../../../utils/string')

const TAG_NAME = 'camera'

module.exports = function ({ print }) {
  const baiduValueLogError = print({ platform: 'baidu', tag: TAG_NAME, isError: true, type: 'value' })
  const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qqValueLog = print({ platform: 'qq', tag: TAG_NAME, isError: false, type: 'value' })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const qqEventLog = print({ platform: 'qq', tag: TAG_NAME, isError: false, type: 'event' })
  return {
    test: TAG_NAME,
    props: [
      {
        test: 'mode',
        swan ({ name, value }) {
          // 百度只有相机模式，也就是微信的mode=normal
          if (value !== 'normal') {
            baiduValueLogError({ name, value })
          }
          return false
        }
      },
      {
        test: 'flash',
        qq ({ name, value }) {
          const supportList = ['auto', 'on', 'off']
          if (isMustache(value) || supportList.indexOf(value) === -1) {
            // 如果是个变量，或者是不支持的属性值，报warning
            qqValueLog({ name, value })
          }
        }
      },
      {
        test: /^(resolution|frame-size)$/,
        qq: qqPropLog
      }
    ],
    event: [
      {
        test: /^(scancode)$/,
        swan: baiduEventLog
      },
      {
        test: /^(initdone)$/,
        qq: qqEventLog
      }
    ]
  }
}
