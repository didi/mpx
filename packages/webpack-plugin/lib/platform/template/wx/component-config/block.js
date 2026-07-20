const TAG_NAME = 'block'

module.exports = function () {
  return {
    test: TAG_NAME,
    web (tag, data) {
      data.el.isBlock = true
      return 'template'
    }
  }
}
