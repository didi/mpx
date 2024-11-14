const WebpackSources = require('webpack-sources')
const node_path = require('node:path')
const { createContext, normalizeAbsolutePath } = require('../web-plugin/utils')
const { RESOLVED_ID_RE } = require('../web-plugin/consts')
const { getClassMap } = require('@mpxjs/webpack-plugin/lib/react/style-helper')
const shallowStringify = require('@mpxjs/webpack-plugin/lib/utils/shallow-stringify')

const PLUGIN_NAME = 'unocss:webpack'

function WebpackPlugin (configOrPath, defaults) {
  return {
    apply (compiler) {
      const ctx = createContext(configOrPath, defaults)
      const { uno, filter, transformCache } = ctx
      compiler.__unoCtx = ctx
      // transform 提取tokens
      compiler.options.module.rules.unshift({
        enforce: 'pre',
        use: (data) => {
          if (data.resource == null) { return [] }

          const id = normalizeAbsolutePath(data.resource + (data.resourceQuery || ''))
          if (filter('', id) && !id.match(/\.html$/) && !RESOLVED_ID_RE.test(id)) {
            return [{
              loader: node_path.resolve(__dirname, '../web-plugin/transform-loader')
            }]
          }

          return []
        }
      })

      compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
        compilation.hooks.optimizeAssets.tapPromise(PLUGIN_NAME, async () => {
          const { mode, srcMode } = compilation.__mpx__
          // 清空transformCache避免watch修改不生效
          transformCache.clear()
          const tokens = new Set()
          for (const module of compilation.modules) {
            const assetsInfo = module.buildInfo.assetsInfo || new Map()
            for (const [, { unocssTokens } = {}] of assetsInfo) {
              if (unocssTokens) {
                for (const token of unocssTokens) {
                  tokens.add(token)
                }
              }
            }
          }
          const result = await uno.generate(tokens, { minify: true })
          if (uno._mpx2rnUnsuportedRules && uno._mpx2rnUnsuportedRules.length) {
            compilation.errors.push(`[Mpx Unocss]: all those '${uno._mpx2rnUnsuportedRules.join(',')}' class utilities is not supported in react native mode`)
          }
          const classMap = getClassMap({
            content: result.css,
            filename: 'mpx2rn-unocss',
            mode,
            srcMode,
            warn: (msg) => {
              compilation.warnings.push(msg)
            },
            error: (msg) => {
              compilation.errors.push(msg)
            },
            formatValueFn: 'formatValue'
          })
          const files = Object.keys(compilation.assets)
          for (const file of files) {
            if (file === '*') { return }
            let code = compilation.assets[file].source().toString()
            let replaced = false
            code = code.replace('__unocssMap__', () => {
              replaced = true
              return shallowStringify(classMap)
            })
            if (replaced) { compilation.assets[file] = new WebpackSources.RawSource(code) }
          }
        })
      })
    }
  }
}

module.exports = WebpackPlugin
