const templateCompiler = require('../template-compiler/compiler')
const genComponentTag = require('../utils/gen-component-tag')
const addQuery = require('../utils/add-query')
const parseRequest = require('../utils/parse-request')
const { matchCondition } = require('../utils/match-condition')

module.exports = function (template, {
  loaderContext,
  hasScoped,
  hasComment,
  isNative,
  srcMode,
  moduleId,
  ctorType,
  usingComponentsInfo,
  componentGenerics
}, callback) {
  const mpx = loaderContext.getMpx()
  const {
    mode,
    env,
    defs,
    wxsContentMap,
    decodeHTMLText,
    externalClasses,
    checkUsingComponents,
    webConfig,
    autoVirtualHostRules,
    forceProxyEventRules
  } = mpx
  const { resourcePath, rawResourcePath } = parseRequest(loaderContext.resource)
  const builtInComponentsMap = {}

  let wxsModuleMap, genericsInfo
  let output = '/* template */\n'

  if (ctorType === 'app') {
    const { el } = webConfig
    const idName = (el && el.match(/#(.*)/) && el.match(/#(.*)/)[1]) || 'app'
    template = {
      tag: 'template',
      content: `<div id="${idName}"><transition :name="transitionName"><mpx-keep-alive><router-view></router-view></mpx-keep-alive></transition></div>`
    }
    builtInComponentsMap['mpx-keep-alive'] = {
      resource: addQuery('@mpxjs/webpack-plugin/lib/runtime/components/web/mpx-keep-alive.vue', { isComponent: true })
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
        const warn = (msg) => {
          loaderContext.emitWarning(
            new Error('[template compiler][' + loaderContext.resource + ']: ' + msg)
          )
        }
        const error = (msg) => {
          loaderContext.emitError(
            new Error('[template compiler][' + loaderContext.resource + ']: ' + msg)
          )
        }
        const { root, meta } = templateCompiler.parse(template.content, {
          warn,
          error,
          usingComponentsInfo, // processTemplate中无其他地方使用，直接透传 string 类型
          hasComment,
          isNative,
          ctorType,
          mode,
          env,
          srcMode: templateSrcMode,
          defs,
          decodeHTMLText,
          externalClasses,
          hasScoped,
          moduleId,
          filePath: rawResourcePath,
          i18n: null,
          checkUsingComponents,
          // web模式下全局组件不会被合入usingComponents中，故globalComponents可以传空
          globalComponents: [],
          // web模式下实现抽象组件
          componentGenerics,
          hasVirtualHost: matchCondition(resourcePath, autoVirtualHostRules),
          forceProxyEvent: matchCondition(resourcePath, forceProxyEventRules)
        })
        if (meta.wxsModuleMap) {
          wxsModuleMap = meta.wxsModuleMap
        }
        if (meta.wxsContentMap) {
          for (const module in meta.wxsContentMap) {
            wxsContentMap[`${rawResourcePath}~${module}`] = meta.wxsContentMap[module]
          }
        }
        if (meta.builtInComponentsMap) {
          Object.keys(meta.builtInComponentsMap).forEach((name) => {
            builtInComponentsMap[name] = {
              resource: addQuery(meta.builtInComponentsMap[name], { isComponent: true })
            }
          })
        }
        if (meta.genericsInfo) {
          genericsInfo = meta.genericsInfo
        }
        return templateCompiler.serialize(root)
      }
    })
    output += '\n'
  }

  callback(null, {
    output,
    builtInComponentsMap,
    genericsInfo,
    wxsModuleMap
  })
}
