const isUrlRequestRaw = require('loader-utils').isUrlRequest
const tagRE = /\{\{((?:.|\n)+?)\}\}(?!})/

module.exports = function isUrlRequest (url, root) {
  // 对于@开头且后续字符串为合法标识符的情况也返回false，识别为theme变量
  if (/^@[A-Za-z_$][A-Za-z0-9_$]*$/.test(url)) return false
  if (/^.+:\/\//.test(url)) return false
  // 对于url中存在Mustache插值的情况也返回false
  if (tagRE.test(url)) return false
  return isUrlRequestRaw(url, root)
}
