const compiler = require('./compiler')
const bindThis = require('./bind-this')
const parseRequest = require('../utils/parse-request')
const { matchCondition } = require('../utils/match-condition')
const loaderUtils = require('loader-utils')
const checkIsRuntimeMode = require('../utils/check-is-runtime')
const { MPX_DISABLE_EXTRACTOR_CACHE, DYNAMIC_TEMPLATE } = require('../utils/const')
const RecordTemplateRuntimeInfoDependency = require('../dependencies/RecordTemplateRuntimeInfoDependency')
const simplifyAstTemplate = require('./simplify-template')
const { createTemplateEngine } = require('@mpxjs/template-engine')

module.exports = function (raw) {
  this.cacheable()
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const mpx = this.getMpx()
  const root = mpx.projectRoot
  const mode = mpx.mode
  const env = mpx.env
  const defs = mpx.defs
  const i18n = mpx.i18n
  const externalClasses = mpx.externalClasses
  const decodeHTMLText = mpx.decodeHTMLText
  const globalSrcMode = mpx.srcMode
  const localSrcMode = queryObj.mode
  const packageName = queryObj.packageRoot || mpx.currentPackageRoot || 'main'
  const componentsMap = mpx.componentsMap[packageName]
  const pagesMap = mpx.pagesMap
  const wxsContentMap = mpx.wxsContentMap
  const optimizeRenderRules = mpx.optimizeRenderRules
  const usingComponents = queryObj.usingComponents || []
  const componentPlaceholder = queryObj.componentPlaceholder || []
  const hasComment = queryObj.hasComment
  const isNative = queryObj.isNative
  const hasScoped = queryObj.hasScoped
  const moduleId = queryObj.moduleId || 'm' + mpx.pathHash(resourcePath)
  const runtimeCompile = checkIsRuntimeMode(resourcePath)
  const componentInfo = JSON.parse(queryObj.componentInfo || '{}')
  const moduleIdString = JSON.stringify(moduleId)

  let optimizeRenderLevel = 0
  for (const rule of optimizeRenderRules) {
    if (matchCondition(resourcePath, rule)) {
      optimizeRenderLevel = rule.level || 1
      break
    }
  }
  const warn = (msg) => {
    this.emitWarning(
      new Error('[template compiler][' + this.resource + ']: ' + msg)
    )
  }

  const error = (msg) => {
    this.emitError(
      new Error('[template compiler][' + this.resource + ']: ' + msg)
    )
  }

  if (queryObj.mpxCustomElement) {
    this.cacheable(false)
    raw = '<template is="t_0_container" wx:if="{{r && r.nt}}" data="{{ i: r }}"></template>\n'
    const templateEngine = createTemplateEngine(mode)
    raw += templateEngine.buildTemplate(mpx.runtimeInfo[packageName])
    return raw
  }

  const { root: ast, meta } = compiler.parse(raw, {
    warn,
    error,
    componentInfo,
    runtimeCompile,
    usingComponents,
    componentPlaceholder,
    hasComment,
    isNative,
    isComponent: !!componentsMap[resourcePath],
    isPage: !!pagesMap[resourcePath],
    mode,
    env,
    srcMode: localSrcMode || globalSrcMode,
    defs,
    decodeHTMLText,
    externalClasses,
    hasScoped,
    moduleId,
    // 这里需传递resourcePath和wxsContentMap保持一致
    filePath: resourcePath,
    i18n,
    checkUsingComponents: matchCondition(resourcePath, mpx.checkUsingComponentsRules),
    globalComponents: Object.keys(mpx.usingComponents),
    forceProxyEvent: matchCondition(resourcePath, mpx.forceProxyEventRules) || runtimeCompile,
    hasVirtualHost: matchCondition(resourcePath, mpx.autoVirtualHostRules)
  })

  if (meta.runtimeInfo || runtimeCompile) {
    // if (meta.wxsModuleMap) {
    //   meta.runtimeInfo.wxs = Object.keys(meta.wxsModuleMap)
    // }
    // 包含了运行时组件的template模块必须每次都创建（但并不是每次都需要build），用于收集组件节点信息，传递信息以禁用父级extractor的缓存
    this.emitFile(MPX_DISABLE_EXTRACTOR_CACHE, '', undefined, { skipEmit: true })
    // 以 package 为维度存储，meta 上的数据也只是存储了这个组件的 template 上获取的信息，需要在 dependency 里面再次进行合并操作
    this._module.addPresentationalDependency(new RecordTemplateRuntimeInfoDependency(packageName, resourcePath, meta.runtimeInfo))
    this.cacheable(false)
  }

  if (meta.wxsContentMap) {
    for (const module in meta.wxsContentMap) {
      wxsContentMap[`${resourcePath}~${module}`] = meta.wxsContentMap[module]
    }
  }

  let resultSource = ''

  for (const module in meta.wxsModuleMap) {
    const src = loaderUtils.urlToRequest(meta.wxsModuleMap[module], root)
    resultSource += `var ${module} = require(${loaderUtils.stringifyRequest(this, src)});\n`
  }

  const result = compiler.serialize(ast)

  if (isNative) {
    return result
  }

  resultSource += `
global.currentInject = {
  moduleId: ${moduleIdString}
};\n`

  if (runtimeCompile) {
resultSource += `
global.currentInject.render = function(_i, _c, _r, _sc, _g) {
  _r(false, _g(${moduleIdString}))
}
`
  } else {
    const rawCode = compiler.genNode(ast)
    if (rawCode) {
      try {
        const ignoreMap = Object.assign({
          _i: true,
          _c: true,
          _sc: true,
          _r: true
        }, meta.wxsModuleMap)
        const bindResult = optimizeRenderLevel === 2
          ? bindThis.transformSimple(rawCode, {
            ignoreMap
          })
          : bindThis.transform(rawCode, {
            needCollect: true,
            renderReduce: optimizeRenderLevel === 1,
            ignoreMap
          })
        resultSource += `
global.currentInject.render = function (_i, _c, _r, _sc) {
${bindResult.code}
_r(${optimizeRenderLevel === 2 ? 'true' : ''});
};\n`
        if ((mode === 'tt' || mode === 'swan') && bindResult.propKeys) {
          resultSource += `global.currentInject.propKeys = ${JSON.stringify(bindResult.propKeys)};\n`
        }
      } catch (e) {
        error(`
Invalid render function generated by the template, please check!\n
Template result:
${result}\n
Error code:
${rawCode}
Error Detail:
${e.stack}`)
        return result
      }
    }
  }

  if (meta.computed) {
    resultSource += bindThis.transform(`
global.currentInject.injectComputed = {
  ${meta.computed.join(',')}
};`).code + '\n'
  }

  if (meta.refs) {
    resultSource += `
global.currentInject.getRefsData = function () {
  return ${JSON.stringify(meta.refs)};
};\n`
  }

  if (meta.options) {
    resultSource += `global.currentInject.injectOptions = ${JSON.stringify(meta.options)};` + '\n'
  }

  this.emitFile(resourcePath, '', undefined, {
    skipEmit: true,
    extractedResultSource: resultSource
  })

  // 运行时编译的组件直接返回基础模板的内容，并产出动态文本内容
  if (runtimeCompile) {
    let simpleAst = ''
    try {
      simpleAst = simplifyAstTemplate(ast, mode)
    } catch (e) {
      error(`simplify the runtime component ast node fail, please check!\n Error Detail: ${e.stack}`)
    }
    this.emitFile(DYNAMIC_TEMPLATE, '', undefined, {
      skipEmit: true,
      extractedDynamicAsset: JSON.stringify(simpleAst)
    })
    return '<template is="mpx_tmpl" data="{{ r: r }}"></template><template name="mpx_tmpl"><element r="{{r}}" wx:if="{{r}}"></element></template>'
    // return '<import src="/${packageName}/mpx-custom-element-dynamic.wxml" /><template is="tmpl_0_container" data="{{ i: r }}" wx:if="{{r && r.nodeType}}"></template>'
  }

  return result
}
