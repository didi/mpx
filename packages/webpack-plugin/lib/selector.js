const parseComponent = require('./parser')
const parseRequest = require('./utils/parse-request')

module.exports = function (content) {
  this.cacheable()

  // 移除mpx访问依赖，支持 thread-loader
  const { mode, env } = this.getOptions() || {}
  if (!mode && !env) {
    return content
  }

  const { queryObj } = parseRequest(this.resource)
  const ctorType = queryObj.ctorType
  const type = queryObj.type
  const index = queryObj.index || 0
  const filePath = this.resourcePath
  const parts = parseComponent(content, {
    filePath,
    needMap: this.sourceMap,
    mode,
    env
  })
  let part = parts[type]
  if (Array.isArray(part)) {
    part = part[index]
  }
  if (!part) {
    let content = ''
    // 补全js内容
    if (type === 'script') {
      switch (ctorType) {
        case 'app':
          content += 'import {createApp} from "@mpxjs/core"\n' +
            'createApp({})\n'
          break
        case 'page':
          content += 'import {createPage} from "@mpxjs/core"\n' +
            'createPage({})\n'
          break
        case 'component':
          content += 'import {createComponent} from "@mpxjs/core"\n' +
            'createComponent({})\n'
      }
    }
    part = { content }
  }
  part = part || { content: '' }
  this.callback(null, part.content, part.map)
}
