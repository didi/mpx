module.exports = function isEmptyObject (obj) {
  if (!obj) {
    return true
  }
  /* eslint-disable  no-unreachable-loop */
  for (const key in obj) {
    return false
  }
  return true
}
