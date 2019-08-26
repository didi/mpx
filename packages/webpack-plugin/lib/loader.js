const path = require('path')
const hash = require('hash-sum')
const parse = require('./parser')
const createHelpers = require('./helpers')
const loaderUtils = require('loader-utils')
const InjectDependency = require('./dependency/InjectDependency')
const stripExtension = require('./utils/strip-extention')

module.exports = function (content) {
  this.cacheable()

  const mpx = this._compilation.__mpx__
  if (!mpx) {
    return content
  }
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap
  const projectRoot = mpx.projectRoot
  const mode = mpx.mode
  const globalSrcMode = mpx.srcMode
  const resolveMode = mpx.resolveMode
  const localSrcMode = loaderUtils.parseQuery(this.resourceQuery || '?').mode
  const resource = stripExtension(this.resource)
  const srcMode = localSrcMode || globalSrcMode

  const resourceQueryObj = loaderUtils.parseQuery(this.resourceQuery || '?')

  // 支持资源query传入page或component支持页面/组件单独编译
  if ((resourceQueryObj.component && !componentsMap[resource]) || (resourceQueryObj.page && !pagesMap[resource])) {
    let entryChunkName
    const rawRequest = this._module.rawRequest
    const _preparedEntrypoints = this._compilation._preparedEntrypoints
    for (let i = 0; i < _preparedEntrypoints.length; i++) {
      if (rawRequest === _preparedEntrypoints[i].request) {
        entryChunkName = _preparedEntrypoints[i].name
        break
      }
    }
    if (entryChunkName) {
      if (resourceQueryObj.component) {
        componentsMap[resource] = entryChunkName
      } else {
        pagesMap[resource] = entryChunkName
      }
    }
  }

  const loaderContext = this
  const isProduction = this.minimize || process.env.NODE_ENV === 'production'
  const options = loaderUtils.getOptions(this) || {}

  if (!mpx.loaderOptions) {
    // 传递给nativeLoader复用
    mpx.loaderOptions = options
  }

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

  const parts = parse(content, filePath, this.sourceMap, mode)
  //
  const hasScoped = parts.styles.some(({ scoped }) => scoped)
  const templateAttrs = parts.template && parts.template.attrs && parts.template.attrs
  const hasComment = templateAttrs && templateAttrs.comments
  const isNative = false

  let usingComponents = [].concat(mpx.usingComponents)
  try {
    let ret = JSON.parse(parts.json.content)
    if (ret.usingComponents) {
      usingComponents = usingComponents.concat(Object.keys(ret.usingComponents))
    }
  } catch (e) {
  }

  function processSrc (part) {
    if (resolveMode === 'native' && part.src) {
      part.src = loaderUtils.urlToRequest(part.src, projectRoot)
    }
    return part
  }

  const {
    getRequire,
    getNamedExports,
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
    isNative,
    projectRoot
  )

  // 触发webpack global var 注入
  let output = 'global.currentModuleId;\n'

  // 注入模块id及资源路径
  let globalInjectCode = `global.currentModuleId = ${JSON.stringify(moduleId)};\n`
  globalInjectCode += `global.currentResource = ${JSON.stringify(filePath)};\n`

  // 注入构造函数
  let ctor = 'App'
  if (pagesMap[resource]) {
    ctor = mode === 'ali' ? 'Page' : 'Component'
  } else if (componentsMap[resource]) {
    ctor = 'Component'
  }
  globalInjectCode += `global.currentCtor = ${ctor};\n`

  if (!pagesMap[resource] && !componentsMap[resource] && mode === 'swan') {
    // 注入swan runtime fix
    globalInjectCode += 'if (!global.navigator) {\n' +
      '  global.navigator = {};\n' +
      '}\n' +
      'global.navigator.standalone = true;\n'
  }

  //
  // <script>
  output += '/* script */\n'
  let scriptSrcMode = srcMode
  const script = parts.script
  if (script) {
    processSrc(script)
    scriptSrcMode = script.mode || scriptSrcMode
    output += script.src
      ? (getNamedExportsForSrc('script', script) + '\n')
      : (getNamedExports('script', script) + '\n') + '\n'
  } else {
    if (pagesMap[resource]) {
      // page
      output += 'import {createPage} from "@mpxjs/core"\n' +
        'createPage({})\n'
    } else if (componentsMap[resource]) {
      // component
      output += 'import {createComponent} from "@mpxjs/core"\n' +
        'createComponent({})\n'
    } else {
      // app
      output += 'import {createApp} from "@mpxjs/core"\n' +
        'createApp({})\n'
    }
    output += '\n'
  }

  if (scriptSrcMode) {
    globalInjectCode += `global.currentSrcMode = ${JSON.stringify(scriptSrcMode)};\n`
  }

  //
  // <styles>
  output += '/* styles */\n'
  let cssModules
  if (parts.styles.length) {
    let styleInjectionCode = ''
    parts.styles.forEach((style, i) => {
      processSrc(style)
      // require style
      let requireString = style.src
        ? getRequireForSrc('styles', style, -1, style.scoped, undefined, true)
        : getRequire('styles', style, i, style.scoped)

      const hasStyleLoader = requireString.indexOf('style-loader') > -1
      const invokeStyle = code => `${code}\n`

      const moduleName = style.module === true ? '$style' : style.module
      // setCssModule
      if (moduleName) {
        if (!cssModules) {
          cssModules = {}
        }
        if (moduleName in cssModules) {
          loaderContext.emitError(
            'CSS module name "' + moduleName + '" is not unique!'
          )
          styleInjectionCode += invokeStyle(requireString)
        } else {
          cssModules[moduleName] = true

          if (!hasStyleLoader) {
            requireString += '.locals'
          }

          styleInjectionCode += invokeStyle(
            'this["' + moduleName + '"] = ' + requireString
          )
        }
      } else {
        styleInjectionCode += invokeStyle(requireString)
      }
    })
    output += styleInjectionCode + '\n'
  }

  //
  // <json>
  output += '/* json */\n'
  let json = parts.json || {}
  if (json) {
    processSrc(json)
    if (json.src) {
      this.emitError(new Error('[mpx loader][' + this.resource + ']: ' + 'json content must be inline in .mpx files!'))
    }
    output += json.src
      ? (getRequireForSrc('json', json) + '\n')
      : (getRequire('json', json) + '\n') + '\n'
  }

  //
  // <template>
  output += '/* template */\n'
  const template = parts.template
  if (template) {
    processSrc(template)
    output += template.src
      ? (getRequireForSrc('template', template) + '\n')
      : (getRequire('template', template) + '\n') + '\n'
  }

  if (!mpx.forceDisableInject) {
    const dep = new InjectDependency({
      content: globalInjectCode,
      index: -3
    })
    this._module.addDependency(dep)
  }

  return output
}
