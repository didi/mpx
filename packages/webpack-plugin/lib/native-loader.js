const hash = require('hash-sum')
const path = require('path')
const stripExtension = require('./utils/strip-extention')
const loaderUtils = require('loader-utils')
const config = require('./config')
const createHelpers = require('./helpers')
const InjectDependency = require('./dependency/InjectDependency')
const stringifyQuery = require('./utils/stringify-query')

module.exports = function (content) {
  this.cacheable()

  if (!this._compilation.__mpx__) {
    return content
  }

  const loaderContext = this
  const isProduction = this.minimize || process.env.NODE_ENV === 'production'
  const options = loaderUtils.getOptions(this) || {}

  const filePath = this.resourcePath

  const context = (
    this.rootContext ||
    (this.options && this.options.context) ||
    process.cwd()
  )
  const shortFilePath = path.relative(context, filePath).replace(/^(\.\.[\\/])+/, '')
  const moduleId = hash(isProduction ? (shortFilePath + '\n' + content) : shortFilePath)

  const needCssSourceMap = (
    !isProduction &&
    this.sourceMap &&
    options.cssSourceMap !== false
  )

  const hasScoped = false
  const hasComment = false
  const isNative = true

  const usingComponents = []

  const mode = this._compilation.__mpx__.mode
  const globalSrcMode = this._compilation.__mpx__.srcMode
  const queryObj = loaderUtils.parseQuery(this.resourceQuery || '?')
  const localSrcMode = queryObj.mode
  const pagesMap = this._compilation.__mpx__.pagesMap
  const componentsMap = this._compilation.__mpx__.componentsMap
  const resource = stripExtension(this.resource)
  const isApp = !pagesMap[resource] && !componentsMap[resource]
  const srcMode = localSrcMode || globalSrcMode

  const {
    getRequireForSrc,
    getNamedExportsForSrc
  } = createHelpers(
    loaderContext,
    options,
    moduleId,
    isProduction,
    hasScoped,
    hasComment,
    usingComponents,
    needCssSourceMap,
    srcMode,
    isNative
  )

  const typeExtMap = config[srcMode].typeExtMap

  function getRequire (type) {
    let localQuery = Object.assign({}, queryObj)
    let src = resource + typeExtMap[type]
    if (type === 'template' && isApp) {
      return ''
    }
    if (type === 'json') {
      localQuery.__component = true
    }
    src += stringifyQuery(localQuery)

    if (type === 'script') {
      return getNamedExportsForSrc(type, { src })
    } else {
      return getRequireForSrc(type, { src })
    }
  }

  // 注入模块id
  let globalInjectCode = `global.currentModuleId = ${JSON.stringify(moduleId)};\n`

  // 注入构造函数
  let ctor = 'App'
  if (pagesMap[resource]) {
    ctor = mode === 'ali' ? 'Page' : 'Component'
  } else if (componentsMap[resource]) {
    ctor = 'Component'
  }
  globalInjectCode += `global.currentCtor = ${ctor};\n`

  if (isApp && mode === 'swan') {
    // 注入swan runtime fix
    globalInjectCode += 'if (!global.navigator) {\n' +
      '  global.navigator = {};\n' +
      '}\n' +
      'global.navigator.standalone = true;\n'
  }

  if (srcMode) {
    globalInjectCode += `global.currentSrcMode = ${JSON.stringify(srcMode)};\n`
  }

  const dep = new InjectDependency({
    content: globalInjectCode,
    index: -3
  })
  this._module.addDependency(dep)

  // 触发webpack global var 注入
  let output = 'global.currentModuleId;\n'

  for (let type in typeExtMap) {
    output += `/* ${type} */\n${getRequire(type)}\n\n`
  }

  return output
}
