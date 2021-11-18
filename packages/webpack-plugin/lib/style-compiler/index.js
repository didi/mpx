const postcss = require('postcss')
const loadPostcssConfig = require('./load-postcss-config')
const trim = require('./plugins/trim')
const rpx = require('./plugins/rpx')
const vw = require('./plugins/vw')
const pluginCondStrip = require('./plugins/conditional-strip')
const scopeId = require('./plugins/scope-id')
const transSpecial = require('./plugins/trans-special')
const matchCondition = require('../utils/match-condition')
const parseRequest = require('../utils/parse-request')

module.exports = function (css, map) {
  if (/mpx-custom-element\.mpx/.test(this.resourcePath)) {
    this.cacheable(false)
  } else {
    this.cacheable()
  }
  const cb = this.async()
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const id = queryObj.moduleId || queryObj.mid
  const mpx = this.getMpx()
  const defs = mpx.defs
  const mode = mpx.mode
  const packageName = queryObj.packageRoot || mpx.currentPackageRoot || 'main'
  const componentsMap = mpx.componentsMap[packageName]
  const pagesMap = mpx.pagesMap
  const isApp = !(pagesMap[resourcePath] || componentsMap[resourcePath])
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
    // ali环境处理host选择器
    if (mode === 'ali') {
      plugins.push(transSpecial({ id }))
    }

    if (queryObj.scoped) {
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
        // ali环境添加全局样式抹平root差异
        if (mode === 'ali' && isApp) {
          result.css += '\n.mpx-root-view { display: inline; line-height: normal; }\n'
        }
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
