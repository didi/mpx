const templateCompiler = require('../template-compiler/compiler')
const genComponentTag = require('../utils/gen-component-tag')
const addQuery = require('../utils/add-query')

module.exports = function (template, options, callback) {
  const mode = options.mode
  const srcMode = options.srcMode
  const loaderContext = options.loaderContext
  const ctorType = options.ctorType
  const builtInComponentsMap = {}
  let output = '/* template */\n'

  if (ctorType === 'app') {
    template = {
      type: 'template',
      content: '<router-view></router-view>'
    }
  }

  if (template) {
    if (template.src) {
      return callback(new Error('[mpx loader][' + this.resource + ']: ' + 'template content must be inline in .mpx files!'))
    }
    if (template.lang) {
      return callback(new Error('[mpx loader][' + this.resource + ']: ' + 'template lang is not supported in trans web mode temporarily, we will support it in the future!'))
    }

    output += genComponentTag(template, (template) => {
      if (template.content) {
        const templateSrcMode = template.mode || srcMode
        const parsed = templateCompiler.parse(template.content, {
          warn: (msg) => {
            this.emitWarning(
              new Error('[template compiler][' + loaderContext.resource + ']: ' + msg)
            )
          },
          error: (msg) => {
            this.emitError(
              new Error('[template compiler][' + loaderContext.resource + ']: ' + msg)
            )
          },
          mode,
          srcMode: templateSrcMode
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
