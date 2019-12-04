const hash = require('hash-sum')
const parseComponent = require('./parser')
const createHelpers = require('./helpers')
const loaderUtils = require('loader-utils')
const InjectDependency = require('./dependency/InjectDependency')
const parseRequest = require('./utils/parse-request')
const matchCondition = require('./utils/match-condition')
const fixUsingComponent = require('./utils/fix-using-component')
const addQuery = require('./utils/add-query')
const async = require('async')
const processJSON = require('./web/processJSON')
const processScript = require('./web/processScript')
const processStyles = require('./web/processStyles')
const processTemplate = require('./web/processTemplate')

module.exports = function (content) {
  this.cacheable()

  const mpx = this._compilation.__mpx__
  if (!mpx) {
    return content
  }
  const packageName = mpx.currentPackageRoot || 'main'
  const pagesMap = mpx.pagesMap
  const componentsMap = mpx.componentsMap[packageName]
  const resolveMode = mpx.resolveMode
  const projectRoot = mpx.projectRoot
  const mode = mpx.mode
  const defs = mpx.defs
  const globalSrcMode = mpx.srcMode
  const localSrcMode = loaderUtils.parseQuery(this.resourceQuery || '?').mode
  const resourcePath = parseRequest(this.resource).resourcePath
  const srcMode = localSrcMode || globalSrcMode
  const vueContentCache = mpx.vueContentCache
  const autoScope = matchCondition(resourcePath, mpx.autoScopeRules)

  const resourceQueryObj = loaderUtils.parseQuery(this.resourceQuery || '?')

  // 支持资源query传入page或component支持页面/组件单独编译
  if ((resourceQueryObj.component && !componentsMap[resourcePath]) || (resourceQueryObj.page && !pagesMap[resourcePath])) {
    let entryChunkName
    const rawRequest = this._module.rawRequest
    const _preparedEntrypoints = this._compilation._preparedEntrypoints
    for (let i = 0; i < _preparedEntrypoints.length; i++) {
      if (rawRequest === _preparedEntrypoints[i].request) {
        entryChunkName = _preparedEntrypoints[i].name
        break
      }
    }
    if (resourceQueryObj.component) {
      componentsMap[resourcePath] = entryChunkName || 'noEntryComponent'
    } else {
      pagesMap[resourcePath] = entryChunkName || 'noEntryPage'
    }
  }

  let ctorType = 'app'
  if (pagesMap[resourcePath]) {
    // page
    ctorType = 'page'
  } else if (componentsMap[resourcePath]) {
    // component
    ctorType = 'component'
  }

  const loaderContext = this
  const isProduction = this.minimize || process.env.NODE_ENV === 'production'
  const options = loaderUtils.getOptions(this) || {}

  const filePath = this.resourcePath

  // web输出模式下没有任何inject，可以通过cache直接返回
  if (vueContentCache.has(filePath)) {
    return vueContentCache.get(filePath)
  }

  const moduleId = 'm' + hash(this._module.identifier())

  const needCssSourceMap = (
    !isProduction &&
    this.sourceMap &&
    options.cssSourceMap !== false
  )

  const parts = parseComponent(content, filePath, this.sourceMap, mode, defs)

  let output = ''
  // 只有ali才可能需要scoped
  const hasScoped = (parts.styles.some(({ scoped }) => scoped) || autoScope) && mode === 'ali'
  const templateAttrs = parts.template && parts.template.attrs
  const hasComment = templateAttrs && templateAttrs.comments
  const isNative = false

  let usingComponents = [].concat(Object.keys(mpx.usingComponents))
  try {
    let ret = JSON.parse(parts.json.content)
    if (ret.usingComponents) {
      fixUsingComponent({ usingComponents: ret.usingComponents, mode })
      usingComponents = usingComponents.concat(Object.keys(ret.usingComponents))
    }
  } catch (e) {
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
    projectRoot,
    resolveMode
  )

  // 处理mode为web时输出vue格式文件
  if (mode === 'web') {
    if (ctorType === 'app' && !resourceQueryObj.app) {
      const request = addQuery(this.resource, { app: true })
      output += `
      import App from '${request}'
      import Vue from 'vue'
      new Vue({
        el: '#app',
        render: function(h){
          return h(App)
        }
      })\n
      `
      // 直接结束loader进入parse
      this.loaderIndex = -1
      return output
    }

    const callback = this.async()

    return async.waterfall([
      (callback) => {
        async.parallel([
          (callback) => {
            processTemplate(parts.template, {
              mode,
              srcMode,
              loaderContext,
              ctorType
            }, callback)
          },
          (callback) => {
            processStyles(parts.styles, {
              ctorType
            }, callback)
          },
          (callback) => {
            processJSON(parts.json, {
              mode,
              defs,
              resolveMode,
              loaderContext,
              pagesMap,
              componentsMap,
              projectRoot
            }, callback)
          }
        ], (err, res) => {
          callback(err, res)
        })
      },
      ([templateRes, stylesRes, jsonRes], callback) => {
        output += templateRes.output
        output += stylesRes.output
        output += jsonRes.output
        processScript(parts.script, {
          ctorType,
          srcMode,
          loaderContext,
          isProduction,
          getRequireForSrc,
          mpxCid: resourceQueryObj.mpxCid,
          builtInComponentsMap: templateRes.builtInComponentsMap,
          localComponentsMap: jsonRes.localComponentsMap,
          localPagesMap: jsonRes.localPagesMap
        }, callback)
      }
    ], (err, scriptRes) => {
      if (err) return callback(err)
      output += scriptRes.output
      vueContentCache.set(filePath, output)
      console.log(output)
      callback(null, output)
    })
  }

  // 触发webpack global var 注入
  output += 'global.currentModuleId;\n'

  // todo loader中inject dep比较危险，watch模式下不一定靠谱，可考虑将import改为require然后通过修改loader内容注入
  // 注入模块id及资源路径
  let globalInjectCode = `global.currentModuleId = ${JSON.stringify(moduleId)};\n`
  if (!isProduction) {
    globalInjectCode += `global.currentResource = ${JSON.stringify(filePath)};\n`
  }

  // 注入构造函数
  let ctor = 'App'
  if (ctorType === 'page') {
    ctor = mode === 'ali' ? 'Page' : 'Component'
  } else if (ctorType === 'component') {
    ctor = 'Component'
  }
  globalInjectCode += `global.currentCtor = ${ctor};\n`

  //
  // <script>
  output += '/* script */\n'
  let scriptSrcMode = srcMode
  const script = parts.script
  if (script) {
    scriptSrcMode = script.mode || scriptSrcMode
    output += script.src
      ? (getNamedExportsForSrc('script', script) + '\n')
      : (getNamedExports('script', script) + '\n') + '\n'
  } else {
    switch (ctorType) {
      case 'app':
        output += 'import {createApp} from "@mpxjs/core"\n' +
          'createApp({})\n'
        break
      case 'page':
        output += 'import {createPage} from "@mpxjs/core"\n' +
          'createPage({})\n'
        break
      case 'component':
        output += 'import {createComponent} from "@mpxjs/core"\n' +
          'createComponent({})\n'
    }
    output += '\n'
  }

  if (scriptSrcMode) {
    globalInjectCode += `global.currentSrcMode = ${JSON.stringify(scriptSrcMode)};\n`
  }

  // styles
  output += '/* styles */\n'
  let cssModules
  if (parts.styles.length) {
    let styleInjectionCode = ''
    parts.styles.forEach((style, i) => {
      let scoped = hasScoped ? (style.scoped || autoScope) : false
      // require style
      let requireString = style.src
        ? getRequireForSrc('styles', style, -1, scoped, undefined, true)
        : getRequire('styles', style, i, scoped)

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

  // json
  output += '/* json */\n'
  let json = parts.json
  if (json) {
    if (json.src) {
      this.emitError(new Error('[mpx loader][' + this.resource + ']: ' + 'json content must be inline in .mpx files!'))
    } else {
      output += getRequire('json', json) + '\n\n'
    }
  }

  // template
  output += '/* template */\n'
  const template = parts.template
  if (template) {
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
