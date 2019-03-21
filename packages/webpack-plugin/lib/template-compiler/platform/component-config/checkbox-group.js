const TAG_NAME = 'checkbox-group'

module.exports = function ({ warn, error }) {
  return {
    test: TAG_NAME,
    event: [
      {
        test: /^(change)$/,
        ali (eventName) {
          const eventMap = {
            'change': 'onchange'
          }
          return eventMap[eventName]
        }
      }
    ]
  }
}
