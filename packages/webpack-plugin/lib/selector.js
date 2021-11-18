const parseComponent = require('./parser')
const parseRequest = require('./utils/parse-request')

module.exports = function (content) {
  this.cacheable()
  // todo 移除mpx访问依赖，支持thread-loader
  const mpx = this.getMpx()
  if (!mpx) {
    return content
  }
  const { queryObj } = parseRequest(this.resource)
  const type = queryObj.type
  const index = queryObj.index || 0
  const mode = mpx.mode
  const env = mpx.env
  const defs = mpx.defs
  const filePath = this.resourcePath
  const parts = parseComponent(content, {
    filePath,
    needMap: this.sourceMap,
    mode,
    defs,
    env
  })
  let part = parts[type] || {}
  if (Array.isArray(part)) {
    part = part[index] || {
      content: ''
    }
  }
  this.callback(null, part.content, part.map)
}
