import WebpackSources from 'webpack-sources'
import nodePath from 'path'
import { createContext, normalizeAbsolutePath } from '../web-plugin/utils.js'
import { RESOLVED_ID_RE } from '../web-plugin/consts.js'
import { getClassMap } from '@mpxjs/webpack-plugin/lib/react/style-helper.js'
import shallowStringify from '@mpxjs/webpack-plugin/lib/utils/shallow-stringify.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url) // 当前文件的绝对路径
const __dirname = nodePath.dirname(__filename) // 当前文件的目录路径

const PLUGIN_NAME = 'unocss:webpack'

function WebpackPlugin (configOrPath, defaults) {
  return {
    apply (compiler) {
      // transform 提取tokens
      compiler.options.module.rules.unshift({
        enforce: 'pre',
        use: (data) => {
          if (data.resource == null) { return [] }

          const id = normalizeAbsolutePath(data.resource + (data.resourceQuery || ''))
          if (compiler.__unoCtx.filter('', id) && !id.match(/\.html$/) && !RESOLVED_ID_RE.test(id)) {
            return [{
              loader: nodePath.resolve(__dirname, '../web-plugin/transform-loader')
            }]
          }

          return []
        }
      })

      compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
        compilation.hooks.optimizeAssets.tapPromise(PLUGIN_NAME, async () => {
          const mpx = compilation.__mpx__
          const { mode, srcMode } = mpx
          const ctx = compiler.__unoCtx
          const uno = ctx.uno
          // 清空transformCache避免watch修改不生效
          ctx.transformCache.clear()
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
          if (uno.blocked.size) {
            compilation.errors.push(`[Mpx Unocss]: all those '${[...uno.blocked].join(', ')}' class utilities is not supported in react native mode`)
          }
          const getLayersClassMap = (layers) => {
            return getClassMap({
              content: result.getLayers(layers),
              filename: 'mpx2rn-unocss',
              mode,
              srcMode,
              warn: msg => {
                compilation.warnings.push(msg)
              },
              error: msg => {
                compilation.errors.push(msg)
              }
            })
          }
          const classMap = getLayersClassMap(result.layers.filter(v => v !== 'varUtilities'))
          const utilitiesClassMap = getLayersClassMap(['varUtilities'])
          const preflightsClassMap = uno._mpx2rnUnoPreflightBase

          const files = Object.keys(compilation.assets)
          for (const file of files) {
            if (file === '*') { return }
            let code = compilation.assets[file].source().toString()
            let replaced = false
            code = code
              .replace('__unoCssMapPlaceholder__', () => {
                replaced = true
                return shallowStringify(classMap)
              })
              .replace('__unoVarUtilitiesCssMap__', () => {
                return shallowStringify(utilitiesClassMap)
              })
              .replace('__unoCssMapPreflights__', () => {
                return JSON.stringify(preflightsClassMap)
              })
            if (replaced) { compilation.assets[file] = new WebpackSources.RawSource(code) }
          }
        })
      })

      compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
        const mpx = compilation.__mpx__
        mpx.unoCtx = compiler.__unoCtx.uno
      })

      compiler.hooks.beforeCompile.tapPromise(PLUGIN_NAME, async (compilation) => {
        const ctx = await createContext(configOrPath, defaults)
        ctx.uno.config.blocklist = ctx.uno.config.blocklist.map((item) => {
          if (typeof item === 'function') {
            return item.bind(ctx.uno)
          }
          return item
        })
        compiler.__unoCtx = ctx
        return ctx
      })
    }
  }
}

export {
  WebpackPlugin as UnoCSSRNWebpackPlugin
}
