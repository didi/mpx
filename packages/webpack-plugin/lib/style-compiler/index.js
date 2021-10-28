const postcss = require('postcss')
const loadPostcssConfig = require('./load-postcss-config')
const trim = require('./plugins/trim')
const rpx = require('./plugins/rpx')
const vw = require('./plugins/vw')
const pluginCondStrip = require('./plugins/conditional-strip')
const scopeId = require('./plugins/scope-id')
const matchCondition = require('../utils/match-condition')
const parseRequest = require('../utils/parse-request')

module.exports = function (css, map) {
  this.cacheable()
  const cb = this.async()
  const { queryObj } = parseRequest(this.resource)
  const mpx = this.getMpx()
  const defs = mpx.defs
  const transRpxRulesRaw = mpx.transRpxRules
  const transRpxRules = transRpxRulesRaw ? (Array.isArray(transRpxRulesRaw) ? transRpxRulesRaw : [transRpxRulesRaw]) : []

  const testResolveRange = (include = () => true, exclude) => {
    return matchCondition(this.resourcePath, { include, exclude })
  }

  const inlineConfig = Object.assign({}, mpx.postcssInlineConfig, { defs })
  loadPostcssConfig(this, inlineConfig).then(config => {
    const plugins = config.plugins.concat(trim)
    const options = Object.assign(
      {
        to: this.resourcePath,
        from: this.resourcePath,
        map: false
      },
      config.options
    )

    if (queryObj.scoped) {
      const id = queryObj.moduleId || queryObj.mid
      plugins.push(scopeId({ id }))
    }

    plugins.push(pluginCondStrip({
      defs
    }))

    for (let item of transRpxRules) {
      const {
        mode,
        comment,
        include,
        exclude,
        designWidth
      } = item || {}

      if (testResolveRange(include, exclude)) {
        // 对同一个资源一旦匹配到，推入一个rpx插件后就不再继续推了
        plugins.push(rpx({ mode, comment, designWidth }))
        break
      }
    }

    if (mpx.mode === 'web') {
      plugins.push(vw)
    }
    // source map
    if (this.sourceMap && !options.map) {
      options.map = {
        inline: false,
        annotation: false,
        prev: map
      }
    }

    return postcss(plugins)
      .process(css, options)
      .then(result => {
        if (result.messages) {
          result.messages.forEach(({ type, file }) => {
            if (type === 'dependency') {
              this.addDependency(file)
            }
          })
        }
        const map = result.map && result.map.toJSON()
        cb(null, result.css, map)
        return null // silence bluebird warning
      })
  }).catch(e => {
    console.error(e)
    cb(e)
  })
}
