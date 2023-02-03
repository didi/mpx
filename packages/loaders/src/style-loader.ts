import postcss from 'postcss'
import { LoaderDefinition } from 'webpack'
import { styleCompiler } from '@mpxjs/compiler'
import {
  loadPostcssConfig,
  matchCondition,
  parseRequest
} from '@mpxjs/compile-utils'
import { ProxyPluginContext, proxyPluginContext } from '@mpxjs/plugin-proxy'
import { MPX_ROOT_VIEW, MPX_APP_MODULE_ID } from './constants'

export const mpxStyleTransform = async function (
  css: string,
  pluginContext: ProxyPluginContext,
  options: {
    sourceMap?: boolean
    resource: string
    mpx: any
    map: any
    isApp?: boolean
  }
): Promise<{
  code: string
  map: any
}> {
  return new Promise((resolve, reject) => {
    const mpx = options.mpx
    const { resourcePath, queryObj } = parseRequest(options.resource)
    const id =
      queryObj.moduleId ||
      queryObj.mid ||
      'm' + (mpx.pathHash && mpx.pathHash(resourcePath))
    const appInfo = mpx.appInfo || {}
    const defs = mpx.defs || {}
    const mode = mpx.mode
    const isApp = options.isApp || resourcePath === appInfo.resourcePath
    const transRpxRulesRaw = mpx.transRpxRules
    const transRpxRules = transRpxRulesRaw
      ? Array.isArray(transRpxRulesRaw)
        ? transRpxRulesRaw
        : [transRpxRulesRaw]
      : []
    const transRpxFn = mpx.webConfig?.transRpxFn
    const testResolveRange = (include = () => true, exclude: () => boolean) => {
      return matchCondition(resourcePath, { include, exclude })
    }

    const inlineConfig = Object.assign({}, mpx.postcssInlineConfig, { defs })
    loadPostcssConfig(
      {
        webpack: pluginContext,
        defs
      },
      inlineConfig as any
    )
      .then(config => {
        const plugins = config.plugins.concat(styleCompiler.trim())
        // ali平台下处理scoped和host选择器
        if (mode === 'ali') {
          if (queryObj.scoped) {
            plugins.push(styleCompiler.scopeId({ id }))
          }
          plugins.push(styleCompiler.transSpecial({ id }))
        }
        plugins.push(
          styleCompiler.pluginCondStrip({
            defs
          })
        )
        for (const item of transRpxRules) {
          const { mode, comment, include, exclude, designWidth } = item || {}
          if (testResolveRange(include, exclude)) {
            // 对同一个资源一旦匹配到，推入一个rpx插件后就不再继续推了
            plugins.push(styleCompiler.rpx({ mode, comment, designWidth }))
            break
          }
        }

        if (mode === 'web') {
          plugins.push(styleCompiler.vw({ transRpxFn }))
        }
        return postcss(plugins)
          .process(css, {
            to: resourcePath,
            from: resourcePath,
            map: options.sourceMap
              ? {
                  inline: false,
                  annotation: false,
                  prev: options.map
                }
              : false,
            ...config.options
          })
          .then(result => {
            if (result.messages) {
              // ali环境添加全局样式抹平root差异
              if (mode === 'ali' && isApp) {
                result.css += `\n.${MPX_ROOT_VIEW} { display: initial }\n.${MPX_APP_MODULE_ID} { line-height: normal }`
              }
              result.messages.forEach(({ type, file }) => {
                if (type === 'dependency') {
                  pluginContext.addDependency(file)
                }
              })
            }
            const map = result.map && result.map.toJSON()
            resolve({
              code: result.css,
              map: map
            })
          })
      })
      .catch(e => {
        console.error(e)
        reject(e)
      })
  })
}

export default <LoaderDefinition>function mpxStyleLoader(css, map) {
  this.cacheable()
  const cb = this.async()
  mpxStyleTransform(css, proxyPluginContext(this), {
    map,
    resource: this.resource,
    sourceMap: this.sourceMap,
    // @ts-ignore
    mpx: this.getMpx()
  })
    .then(res => {
      cb(null, res.code, res.map)
    })
    .catch(cb)
}
