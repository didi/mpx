const TAG_NAME = 'radio-group'

module.exports = function () {
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
      }
    ]
  }
}
