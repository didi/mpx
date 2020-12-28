const parseComponent = require('./parser')
const loaderUtils = require('loader-utils')
const getMainCompilation = require('./utils/get-main-compilation')

module.exports = function (content) {
  this.cacheable()
  const mainCompilation = getMainCompilation(this._compilation)
  const mpx = mainCompilation.__mpx__
  if (!mpx) {
    return content
  }
  const mode = mpx.mode
  const defs = mpx.defs
  const query = loaderUtils.getOptions(this) || {}
  const filePath = this.resourcePath
  if (mpx.loaderOptions.useStripCode) {
    const startComment = `@${mpx.loaderOptions.useStripCode.startComment || '@if'} `
    // 这个应该要移出去写在枚举文件里面
    const modes = ['wx', 'ali', 'swan', 'qq', 'tt']
    const useMode = modes.reduce((cur, sum) => {
      return sum + '|' + cur
    })
    const endComment = `@${mpx.loaderOptions.useStripCode.endComment || '@endif'}`
    const exp = '[\\t ]*\\/\\* ?' + startComment + '(' + useMode + ')' + ' ?\\*\\/[\\s\\S]*?\\/\\* ?' + endComment + ' ?\\*\\/[\\t ]*\\n?'
    const regexPattern = new RegExp(exp, 'g')
    content = content.replace(regexPattern, function (match) {
      const matchMode = arguments[1]
      if (matchMode === mpx.mode) {
        return match
      } else {
        return ''
      }
    })
  }
  const parts = parseComponent(content, {
    filePath,
    needMap: this.sourceMap,
    mode,
    defs
  })
  let part = parts[query.type] || {}
  if (Array.isArray(part)) {
    part = part[query.index]
  }
  this.callback(null, part.content, part.map)
}
