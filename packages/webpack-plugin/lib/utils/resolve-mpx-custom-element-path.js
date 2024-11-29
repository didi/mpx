module.exports = function (packageName) {
  let subPath = ''
  if (packageName !== 'main') {
    subPath = '/' + packageName
  }
  return subPath + `/mpx-custom-element-${packageName}`
}
