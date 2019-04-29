const TAG_NAME = 'image'

module.exports = function ({ print }) {
  return {
    test: TAG_NAME,
    event: [
      {
        test: /^(error|load)$/,
        ali (eventName) {
          return eventName
        }
      }
    ]
  }
}
