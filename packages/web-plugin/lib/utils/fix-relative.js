module.exports = function (path, mode) {
  if (
    (mode === 'swan' && /^\.\./.test(path)) ||
    !/^\./.test(path)
  ) {
    return './' + path
  }
  return path
}
