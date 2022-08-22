module.exports = {
  hump2dash (value) {
    return value.replace(/[A-Z]/g, function (match) {
      return '-' + match.toLowerCase()
    })
  },
  dash2hump (value) {
    return value.replace(/-([a-z])/g, function (match, p1) {
      return p1.toUpperCase()
    })
  }
}
