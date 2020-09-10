const parseComponent = require('./parser')
const loaderUtils = require('loader-utils')
const parseRequest = require('./utils/parse-request')
const normalize = require('./utils/normalize')
const selectorPath = normalize.lib('selector')
const genComponentTag = require('./utils/gen-component-tag')

module.exports = function (content) {
  this.cacheable()
  const mpx = this._compilation.__mpx__
  if (!mpx) {
    return content
  }
  const mode = mpx.mode
  const defs = mpx.defs
  const resourcePath = parseRequest(this.resource).resourcePath
  const parts = parseComponent(content, resourcePath, this.sourceMap, mode, defs)

  let output = ''

  // 内建组件编写规范比较统一，不需要处理太多情况
  if (parts.template) {
    output += genComponentTag(parts.template)
  }

  if (parts.script) {
    output += genComponentTag(parts.script, (script) => {
      let content = ''
      if (parts.styles && parts.styles.length) {
        parts.styles.forEach((style, i) => {
          const requestString = loaderUtils.stringifyRequest(this, `builtInComponent.styl!=!${selectorPath}?type=styles&index=${i}!${loaderUtils.getRemainingRequest(this)}`)
          content += `\n  import ${requestString}`
        })
      }
      content += script.content
      return content
    })
  }
  return output
}
