const TAG_NAME = 'ad'

module.exports = function ({ print }) {
  const ttValueWarningLog = print({ platform: 'bytedance', type: 'value', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const baiduValueWarningLog = print({ platform: 'baidu', type: 'value', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qqValueWarningLog = print({ platform: 'qq', type: 'value', tag: TAG_NAME, isError: false })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const qqEventLog = print({ platform: 'qq', tag: TAG_NAME, isError: false, type: 'event' })
  const ksPropLog = print({ platform: 'ks', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^ad-type$/,
        tt (obj) {
          obj.name = 'type'
          if (obj.value === 'grid') {
            ttValueWarningLog({ name: 'type', value: obj.value })
          }
          return obj
        },
        qq (obj) {
          obj.name = 'type'
          if (obj.value === 'grid' || obj.value === 'video') {
            qqValueWarningLog({ name: 'type', value: obj.value })
          }
          return obj
        },
        swan (obj) {
          obj.name = 'type'
          if (obj.value === 'grid' || obj.value === 'video') {
            baiduValueWarningLog({ name: 'type', value: obj.value })
          }
          return obj
        },
        ks (obj) {
          obj.name = 'type'
          return obj
        }
      },
      {
        test: /^ad-theme$/,
        tt: ttPropLog
      },
      {
        test: /^(ad-intervals|ad-theme)$/,
        qq: qqPropLog,
        swan: baiduPropLog,
        ks: ksPropLog
      }
    ],
    event: [
      {
        test: /^(close)$/,
        qq: qqEventLog
      }
    ]
  }
}
