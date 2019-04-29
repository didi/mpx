const TAG_NAME = 'picker'

module.exports = function ({ print }) {
  const aliPropLogError = print({ platform: 'ali', tag: TAG_NAME, isError: true })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  return {
    test: TAG_NAME,
    props: [
      {
        test: 'mode',
        ali (attr) {
          if (attr.value !== 'selector') {
            aliPropLogError(attr)
          }
          return false
        }
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
        test: /^(cancel)$/,
        ali: aliEventLog
      }
    ]
  }
}
