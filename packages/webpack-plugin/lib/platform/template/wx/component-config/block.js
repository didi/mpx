const TAG_NAME = 'block'

module.exports = function () {
  return {
    test: TAG_NAME,
    web () {
      return 'template'
    }
  }
}
