const TAG_NAME = 'switch'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const ttPropsLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    props: [
      {
        test: /^type$/,
        ali: aliPropLog
      },
      {
        test: /^disabled$/,
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
        test: /^(linechange|animationfinish)$/,
        ali: aliEventLog
      }
    ]
  }
}
