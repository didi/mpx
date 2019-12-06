const path = require('path')
module.exports = function getPageName (root, page) {
  const match = /^[.~/]*(.*?)(\.[^.]*)?$/.exec(page)
  return path.join(root, match[1])
}
