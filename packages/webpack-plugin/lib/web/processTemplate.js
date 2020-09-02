const templateCompiler = require('../template-compiler/compiler')
const genComponentTag = require('../utils/gen-component-tag')
const addQuery = require('../utils/add-query')

module.exports = function (template, options, callback) {
  const mode = options.mode
  const srcMode = options.srcMode
  const defs = options.defs
  const loaderContext = options.loaderContext
  const ctorType = options.ctorType
  const builtInComponentsMap = {}
  let output = '/* template */\n'

  if (ctorType === 'app') {
    template = {
      type: 'template',
      content: `
        <div style="height: 100%;">
          <div style="height: 100%; overflow: hidden;">
            <div class="pull-down-bswapper">
              <div class="pull-down-loading">
                <div class="dot-flashing"></div>
              </div>
              <mpx-keep-alive>
                <router-view></router-view>
              </mpx-keep-alive>
            </div>
          </div>
        </div>`
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
          mode,
          srcMode: templateSrcMode,
          defs,
          usingComponents: options.usingComponents,
          // web模式下全局组件不会被合入usingComponents中，故globalComponents可以传空
          globalComponents: [],
          checkUsingComponents: options.checkUsingComponents
        })
        if (parsed.meta.builtInComponentsMap) {
          Object.keys(parsed.meta.builtInComponentsMap).forEach((name) => {
            builtInComponentsMap[name] = {
              resource: addQuery(parsed.meta.builtInComponentsMap[name], { component: true })
            }
          })
        }
        return templateCompiler.serialize(parsed.root)
      }
    })
    output += '\n\n'
  }

  callback(null, {
    output,
    builtInComponentsMap
  })
}
