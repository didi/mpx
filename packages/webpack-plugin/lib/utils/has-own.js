const hasOwnProperty = Object.prototype.hasOwnProperty

module.exports = function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}
