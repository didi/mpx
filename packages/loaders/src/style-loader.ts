import postcss from 'postcss'
import { LoaderDefinition } from 'webpack'
import {styleCompiler} from '@mpxjs/compiler'
import loadPostcssConfig from '@mpxjs/utils/loadPostcssConfig'
import { matchCondition } from '@mpxjs/utils/match-condition'
import parseRequest from '@mpxjs/utils/parse-request'
import { MPX_ROOT_VIEW, MPX_APP_MODULE_ID } from './constants'

const mpxStyleLoader: LoaderDefinition = function (css: string, map) {
  this.cacheable()
  const cb = this.async()
  const { resourcePath, queryObj } = parseRequest(this.resource)
  // @ts-ignore
  const mpx = this.getMpx()
  const id = queryObj.moduleId || queryObj.mid || 'm' + mpx.pathHash(resourcePath)
  const appInfo = mpx.appInfo || {}
  const defs = mpx.defs
  const mode = mpx.mode
  const isApp = resourcePath === appInfo.resourcePath
  const transRpxRulesRaw = mpx.transRpxRules
  const transRpxRules = transRpxRulesRaw
    ? Array.isArray(transRpxRulesRaw)
      ? transRpxRulesRaw
      : [transRpxRulesRaw]
    : []

  const transRpxFn = mpx.webConfig.transRpxFn
  const testResolveRange = (include = () => true, exclude: () => boolean) => {
    return matchCondition(this.resourcePath, { include, exclude })
  }

  const inlineConfig = Object.assign({}, mpx.postcssInlineConfig, { defs })
  loadPostcssConfig(
    {
      webpack: this,
      defs
    },
    inlineConfig
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
          to: this.resourcePath,
          from: this.resourcePath,
          map: this.sourceMap
            ? {
              inline: false,
              annotation: false,
              prev: map
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
                this.addDependency(file)
              }
            })
          }
          const map = result.map && result.map.toJSON()
          cb(null, result.css, map as any)
          return null // silence bluebird warning
        })
    })
    .catch(e => {
      console.error(e)
      cb(e)
    })
}

export default mpxStyleLoader
