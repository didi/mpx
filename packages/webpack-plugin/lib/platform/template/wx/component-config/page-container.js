const TAG_NAME = 'page-container'

module.exports = function () {
  return {
    test: TAG_NAME,
    event: [
      {
        test: 'beforeleave',
        ali () {
          return 'beforeLeave'
        }
      }
    ]
  }
}
