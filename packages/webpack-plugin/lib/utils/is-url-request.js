const isUrlRequestRaw = require('loader-utils').isUrlRequest

module.exports = function isUrlRequest (url, root) {
  // 对于任何协议形式的url返回false
  if (/^\w+:\/\//.test(url)) return false
  return isUrlRequestRaw(url, root)
}
