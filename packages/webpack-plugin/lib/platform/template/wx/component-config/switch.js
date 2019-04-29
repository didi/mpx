const TAG_NAME = 'switch'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^type$/,
        ali: aliPropLog
      }
    ],
    event: [
      {
        test: /^(change|input|confirm)$/,
        ali (eventName) {
          const eventMap = {
            'change': 'change',
            'input': 'input',
            'confirm': 'confirm'
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
