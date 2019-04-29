const TAG_NAME = 'picker-view'

module.exports = function ({ print }) {
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  return {
    test: TAG_NAME,
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
        ali: aliEventLog
      }
    ]
  }
}
