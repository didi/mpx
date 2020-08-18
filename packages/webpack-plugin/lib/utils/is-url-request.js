const isUrlRequestRaw = require('loader-utils').isUrlRequest
const tagRE = /\{\{((?:.|\n)+?)\}\}(?!})/

module.exports = function isUrlRequest (url, root) {
  if (/^.+:\/\//.test(url)) return false
  // 对于url中存在Mustache插值的情况也返回false
  if (tagRE.test(url)) return false
  return isUrlRequestRaw(url, root)
}
