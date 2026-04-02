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
  originalUsingComponents,
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
    webConfig,
    autoVirtualHostRules,
    forceProxyEventRules,
    checkUsingComponentsRules,
    globalComponents
  } = mpx
  const { resourcePath, rawResourcePath } = parseRequest(loaderContext.resource)
  const builtInComponentsMap = {}

  let wxsModuleMap, genericsInfo
  let output = '/* template */\n'

  if (ctorType === 'app') {
    const { el, disablePageTransition = true } = webConfig
    const idName = (el && el.match(/#(.*)/) && el.match(/#(.*)/)[1]) || 'app'
    template = {
      tag: 'template',
      content: disablePageTransition
        ? `<div id="${idName}"><mpx-keep-alive><router-view></router-view></mpx-keep-alive></div>`
        : `<div id="${idName}"><transition :name="transitionName"><mpx-keep-alive><router-view></router-view></mpx-keep-alive></transition></div>`
    }
    builtInComponentsMap['mpx-keep-alive'] = {
      resource: addQuery('@mpxjs/webpack-plugin/lib/runtime/components/web/mpx-keep-alive.vue', { isComponent: true })
    }
  }

  if (template) {
    // 由于远端src template资源引用的相对路径可能发生变化，暂时不支持。
    if (template.src) {
      return callback(new Error('[Mpx template error][' + loaderContext.resource + ']: ' + 'template content must be inline in .mpx files!'))
    }
    if (template.lang) {
      return callback(new Error('[Mpx template error][' + loaderContext.resource + ']: ' + 'template lang is not supported in trans web mode temporarily, we will support it in the future!'))
    }

    output += genComponentTag(template, (template) => {
      if (ctorType === 'app') {
        return template.content
      }
      if (template.content) {
        const templateSrcMode = template.mode || srcMode
        const warn = (msg) => {
          loaderContext.emitWarning(
            new Error('[Mpx template error][' + loaderContext.resource + ']: ' + msg)
          )
        }
        const error = (msg) => {
          loaderContext.emitError(
            new Error('[Mpx template error][' + loaderContext.resource + ']: ' + msg)
          )
        }
        const { root, meta } = templateCompiler.parse(template.content, {
          warn,
          error,
          usingComponentsInfo, // processTemplate中无其他地方使用，直接透传 string 类型
          originalUsingComponents,
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
          // 与 template-compiler/index 一致：usingComponentsInfo 已合并 globalComponentsInfo，此处白名单避免对仅 app 注册的组件误报「未使用」
          globalComponents: Object.keys(globalComponents || {}),
          // web模式下实现抽象组件
          componentGenerics,
          hasVirtualHost: matchCondition(resourcePath, autoVirtualHostRules),
          forceProxyEvent: matchCondition(resourcePath, forceProxyEventRules),
          checkUsingComponents: matchCondition(resourcePath, checkUsingComponentsRules)
        })
        if (meta.wxsModuleMap) {
          wxsModuleMap = meta.wxsModuleMap
        }
        if (meta.wxsContentMap) {
          for (const module in meta.wxsContentMap) {
            wxsContentMap[`${rawResourcePath}~${module}`] = meta.wxsContentMap[module]
          }
        }
        const mergedPaths = Object.assign({}, meta.builtInComponentsMap || {}, (webConfig && webConfig.customBuiltInComponents) || {})
        Object.keys(mergedPaths).forEach((name) => {
          builtInComponentsMap[name] = {
            resource: addQuery(mergedPaths[name], { isComponent: true })
          }
        })
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
