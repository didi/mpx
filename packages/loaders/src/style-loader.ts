import postcss from 'postcss'
import { LoaderDefinition } from 'webpack'
import { styleCompiler } from '@mpxjs/compiler'
import { matchCondition, parseRequest } from '@mpxjs/compile-utils'
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
    styleCompiler
      .loadPostcssConfig(pluginContext, inlineConfig as any)
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
            // ali环境添加全局样式抹平root差异
            if (mode === 'ali' && isApp) {
              result.css += `\n.${MPX_ROOT_VIEW} { display: initial }\n.${MPX_APP_MODULE_ID} { line-height: normal }`
            }
            for (const warning of result.warnings()) {
              pluginContext.warn(warning)
            }
            // todo 后续考虑直接使用postcss-loader来处理postcss
            for (const message of result.messages) {
              // eslint-disable-next-line default-case
              switch (message.type) {
                case 'dependency':
                  pluginContext.addDependency(message.file)
                  break

                case 'build-dependency':
                  pluginContext.addBuildDependency(message.file)
                  break

                case 'missing-dependency':
                  pluginContext.addMissingDependency(message.file)
                  break

                case 'context-dependency':
                  pluginContext.addContextDependency(message.file)
                  break

                case 'dir-dependency':
                  pluginContext.addContextDependency(message.dir)
                  break

                case 'asset':
                  if (message.content && message.file) {
                    pluginContext.emitFile(
                      message.file,
                      message.content,
                      message.sourceMap,
                      message.info
                    )
                  }
              }
            }

            resolve({
              code: result.css,
              map: result.map && result.map.toJSON()
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
      // @ts-ignore
      cb(null, res.code, res.map)
    })
    .catch(cb)
}