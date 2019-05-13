const TAG_NAME = 'picker-view'

module.exports = function ({ print }) {
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const ttPropsLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })

  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(indicator-class|mask-class)$/,
        tt: ttPropsLog
      }
    ],
    event: [
      {
        test: /^(change)$/,
        ali (eventName) {
          const eventMap = {
            'change': 'change'
          }
          return eventMap[eventName]
        }
      },
      {
        test: /^(pickstart|pickend)$/,
        ali: aliEventLog,
        swan: baiduEventLog,
        tt: ttEventLog
      }
    ]
  }
}
