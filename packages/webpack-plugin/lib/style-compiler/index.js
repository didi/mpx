const postcss = require('postcss')
const loaderUtils = require('loader-utils')
const loadPostcssConfig = require('./load-postcss-config')

const trim = require('./plugins/trim')
const rpx = require('./plugins/rpx')

module.exports = function (css, map) {
  this.cacheable()
  const cb = this.async()
  const loaderOptions = loaderUtils.getOptions(this) || {}

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

      if (loaderOptions.transRpx) {
        plugins.push(rpx({
          mode: loaderOptions.transRpx === 'all' ? 'all' : 'only',
          comment: loaderOptions.comment
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
            result.messages.forEach(({type, file}) => {
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
