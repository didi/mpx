export default {
  hump2dash (value: string) {
    return value.replace(/[A-Z]/g, function (match) {
      return '-' + match.toLowerCase()
    })
  },
  dash2hump (value : string) {
    return value.replace(/-([a-z])/g, function (_match, p1) {
      return p1.toUpperCase()
    })
  }
}
