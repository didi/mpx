const TAG_NAME = 'movable-area'

module.exports = function ({ warn, error }) {
  return {
    test: TAG_NAME,
    ali () {
      warn(`${TAG_NAME} component is not supported in ali environment!`)
    }
  }
}
