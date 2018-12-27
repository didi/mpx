const postcss = require('postcss')
const loaderUtils = require('loader-utils')
const loadPostcssConfig = require('./load-postcss-config')

const trim = require('./plugins/trim')
const rpx = require('./plugins/rpx')

const orMatcher = items => {
  return str => {
    for (let i = 0; i < items.length; i++) {
      if (items[i](str)) return true
    }
    return false
  }
}

module.exports = function (css, map) {
  this.cacheable()
  const cb = this.async()
  const loaderOptions = loaderUtils.getOptions(this) || {}

  const normalizeCondition = (condition) => {
    if (!condition) throw new Error('Expected condition but got falsy value')
    if (typeof condition === 'string') {
      return str => str.indexOf(condition) === 0
    }
    if (typeof condition === 'function') {
      return condition
    }
    if (condition instanceof RegExp) {
      return condition.test.bind(condition)
    }
    if (Array.isArray(condition)) {
      const items = condition.map(c => normalizeCondition(c))
      return orMatcher(items)
    }
    throw Error(
      'Unexcepted ' +
      typeof condition +
      ' when condition was expected (' +
      condition +
      ')'
    )
  }

  loadPostcssConfig(this)
    .then(config => {
      const plugins = config.plugins.concat(trim)
      const options = Object.assign(
        {
          to: this.resourcePath,
          from: this.resourcePath,
          map: false
        },
        config.options
      )

      const matchInclude = loaderOptions.rpxInclude && normalizeCondition(loaderOptions.rpxInclude)
      const matchExclude = loaderOptions.rpxExclude && normalizeCondition(loaderOptions.rpxExclude)

      let useRpxPlugin = true
      if (!matchInclude(this.resourcePath)) {
        useRpxPlugin = false
      }
      if (matchExclude(this.resourcePath)) {
        useRpxPlugin = false
      }

      if (loaderOptions.transRpx && useRpxPlugin) {
        plugins.push(rpx({
          mode: loaderOptions.transRpx === 'all' ? 'all' : 'only',
          comment: loaderOptions.comment,
          designWidth: loaderOptions.designWidth
        }))
      }

      // source map
      if (loaderOptions.sourceMap && !options.map) {
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
    })
    .catch(e => {
      console.error(e)
      cb(e)
    })
}
