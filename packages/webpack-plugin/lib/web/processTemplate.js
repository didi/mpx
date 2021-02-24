const templateCompiler = require('../template-compiler/compiler')
const genComponentTag = require('../utils/gen-component-tag')
const addQuery = require('../utils/add-query')
const loaderUtils = require('loader-utils')
const path = require('path')
const parseRequest = require('../utils/parse-request')
const getMainCompilation = require('../utils/get-main-compilation')

module.exports = function (template, options, callback) {
  const mode = options.mode
  const srcMode = options.srcMode
  const defs = options.defs
  const loaderContext = options.loaderContext
  const ctorType = options.ctorType
  const resourcePath = parseRequest(loaderContext.resource).resourcePath
  const builtInComponentsMap = {}
  const compilation = loaderContext._compilation
  const mainCompilation = getMainCompilation(compilation)
  const mpx = mainCompilation.__mpx__
  const wxsContentMap = mpx.wxsContentMap
  let genericsInfo
  let output = '/* template */\n'
  let wxsModuleMap = []

  if (ctorType === 'app') {
    template = {
      tag: 'template',
      content: '<div class="app"><mpx-keep-alive><router-view class="page"></router-view></mpx-keep-alive></div>'
    }
    builtInComponentsMap['mpx-keep-alive'] = {
      resource: addQuery('@mpxjs/webpack-plugin/lib/runtime/components/web/mpx-keep-alive.vue', { component: true })
    }
  }

  if (template) {
    // 由于远端src template资源引用的相对路径可能发生变化，暂时不支持。
    if (template.src) {
      return callback(new Error('[mpx loader][' + loaderContext.resource + ']: ' + 'template content must be inline in .mpx files!'))
    }
    if (template.lang) {
      return callback(new Error('[mpx loader][' + loaderContext.resource + ']: ' + 'template lang is not supported in trans web mode temporarily, we will support it in the future!'))
    }

    output += genComponentTag(template, (template) => {
      if (ctorType === 'app') {
        return template.content
      }
      if (template.content) {
        const templateSrcMode = template.mode || srcMode
        const parsed = templateCompiler.parse(template.content, {
          warn: (msg) => {
            loaderContext.emitWarning(
              new Error('[template compiler][' + loaderContext.resource + ']: ' + msg)
            )
          },
          error: (msg) => {
            loaderContext.emitError(
              new Error('[template compiler][' + loaderContext.resource + ']: ' + msg)
            )
          },
          usingComponents: options.usingComponents,
          hasComment: options.hasComment,
          isNative: options.isNative,
          basename: path.basename(resourcePath),
          isComponent: ctorType === 'component',
          mode,
          srcMode: templateSrcMode,
          defs,
          decodeHTMLText: options.decodeHTMLText,
          externalClasses: options.externalClasses,
          scopedId: null,
          filePath: loaderContext.resourcePath,
          i18n: null,
          checkUsingComponents: options.checkUsingComponents,
          // web模式下全局组件不会被合入usingComponents中，故globalComponents可以传空
          globalComponents: [],
          // web模式下实现抽象组件
          componentGenerics: options.componentGenerics
        })
        const meta = parsed.meta

        if (meta.wxsContentMap) {
          for (let module in meta.wxsContentMap) {
            wxsContentMap[`${resourcePath}~${module}`] = meta.wxsContentMap[module]
          }
        }

        if (meta.builtInComponentsMap) {
          Object.keys(meta.builtInComponentsMap).forEach((name) => {
            builtInComponentsMap[name] = {
              resource: addQuery(meta.builtInComponentsMap[name], { component: true })
            }
          })
        }
        if (meta.genericsInfo) {
          genericsInfo = meta.genericsInfo
        }

        for (let module in meta.wxsModuleMap) {
          const src = loaderUtils.urlToRequest(meta.wxsModuleMap[module], options.projectRoot)
          const expression = `require(${loaderUtils.stringifyRequest(this, src)})`
          const _module = loaderContext._module
          const deps = []
          _module.parser.parse(expression, {
            current: {
              addDependency: dep => {
                dep.userRequest = module
                deps.push(dep)
              }
            },
            module: _module
          })
          _module.addVariable(module, expression, deps)
        }

        return templateCompiler.serialize(parsed.root, wxsModuleMap)
      }
    })
    output += '\n\n'
  }


  callback(null, {
    output,
    builtInComponentsMap,
    genericsInfo,
    wxsModuleMap
  })
}
