const TAG_NAME = 'form'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(report-submit-timeout)$/,
        ali: aliPropLog,
        swan: baiduPropLog,
        qq: qqPropLog
      },
      {
        test: /^(report-submit|report-submit-timeout)$/,
        tt: ttPropLog
      }
    ],
    event: [
      {
        test: /^(submit|reset)$/,
        ali (eventName) {
          const eventMap = {
            'submit': 'submit',
            'reset': 'reset'
          }
          return eventMap[eventName]
        }
      }
    ]
  }
}
