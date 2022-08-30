import postcss from 'postcss'
import { LoaderDefinition } from 'webpack'
import trim from '@mpxjs/compiler/style-compiler/plugins/trim'
import rpx from '@mpxjs/compiler/style-compiler/plugins/rpx'
import vw from '@mpxjs/compiler/style-compiler/plugins/vw'
import pluginCondStrip from '@mpxjs/compiler/style-compiler/plugins/conditional-strip'
import { matchCondition } from '@mpxjs/utils/match-condition'
import mpx from '../mpx'
import loadPostcssConfig from '../../utils/loadPostcssConfig'

const StyleCompiler: LoaderDefinition = function (css: string, map) {
  this.cacheable()
  const cb = this.async()
  const defs = mpx.defs
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

  const inlineConfig = Object.assign({}, mpx.postcssInlineConfig)
  loadPostcssConfig(
    {
      webpack: this,
      defs
    },
    inlineConfig
  )
    .then(config => {
      const plugins = config.plugins.concat(trim)
      plugins.push(
        pluginCondStrip({
          defs
        })
      )

      for (const item of transRpxRules) {
        const { mode, comment, include, exclude, designWidth } = item || {}

        if (testResolveRange(include, exclude)) {
          // 对同一个资源一旦匹配到，推入一个rpx插件后就不再继续推了
          plugins.push(rpx({ mode, comment, designWidth }))
          break
        }
      }

      if (mpx.mode === 'web') {
        plugins.push(vw({ transRpxFn }))
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

export default StyleCompiler
