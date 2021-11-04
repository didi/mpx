const { isMustache } = require('../../../../utils/string')

const TAG_NAME = 'camera'

module.exports = function ({ print }) {
  const ttValueLogError = print({ platform: 'bytedance', tag: TAG_NAME, isError: true, type: 'value' })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const baiduValueLogError = print({ platform: 'baidu', tag: TAG_NAME, isError: true, type: 'value' })
  const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qqValueLog = print({ platform: 'qq', tag: TAG_NAME, isError: false, type: 'value' })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const qqEventLog = print({ platform: 'qq', tag: TAG_NAME, isError: false, type: 'event' })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  const qaEventLog = print({ platform: 'qa', tag: TAG_NAME, isError: false, type: 'event' })
  const ksPropLog = print({ platform: 'ks', tag: TAG_NAME, isError: false })
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
        },
        tt ({ name, value }) {
          if (value !== 'normal') {
            ttValueLogError({ name, value })
          }
          return false
        },
        qa: qaPropLog
      },
      {
        test: 'flash',
        qq ({ name, value }) {
          const supportList = ['auto', 'on', 'off']
          if (isMustache(value) || supportList.indexOf(value) === -1) {
            // 如果是个变量，或者是不支持的属性值，报warning
            qqValueLog({ name, value })
          }
        },
        tt: ttPropLog
      },
      {
        test: /^(resolution|frame-size)$/,
        qq: qqPropLog,
        ks: ksPropLog
      },
      {
        test: /^(frame-size|device-position)$/,
        qa (prop) {
          const propsMap = {
            'device-position': 'deviceposition',
            'frame-size': 'framesize'
          }
          prop.name = propsMap[prop.name]
          if (prop.name === 'framesize') {
            const valueMap = {
              'small': 'low',
              'medium': 'medium',
              'large': 'high'
            }
            prop.value = valueMap[prop.value]
          }
          return prop
        }
      }
    ],
    event: [
      {
        test: /^(scancode)$/,
        swan: baiduEventLog,
        tt: ttEventLog,
        qa: qaEventLog
      },
      {
        test: /^(initdone)$/,
        qq: qqEventLog
      }
    ]
  }
}
