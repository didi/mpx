const path = require('path')
const parse = require('./parser')
const loaderUtils = require('loader-utils')

module.exports = function (content) {
  this.cacheable()
  const query = loaderUtils.getOptions(this) || {}
  const filename = path.basename(this.resourcePath)
  const parts = parse(content, filename, this.sourceMap)
  let part = parts[query.type]
  if (Array.isArray(part)) {
    part = part[query.index]
  }
  // json不存在内容时自动补全为组件声明json
  if (query.type === 'json' && !part) {
    part = {
      content: JSON.stringify({
        'component': true
      }, null, 2)
    }
  }
  this.callback(null, part.content, part.map)
}
