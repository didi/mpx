module.exports = function (path) {
  if (/^\.\./.test(path)) {
    return './' + path
  }
  return path
}
