const load = require('postcss-load-config')

let loaded

module.exports = function loadPostcssConfig (loaderContext, inlineConfig = {}) {
  if (inlineConfig.ignoreConfigFile) {
    loaded = Promise.resolve({
      plugins: [],
      options: {}
    })
  }

  if (!loaded) {
    const config = inlineConfig.config || {}
    const ctx = {
      webpack: loaderContext,
      defs: inlineConfig.defs || {}
    }
    loaded = load(ctx, config.path, {
      loaders: { '.json': (_, content) => JSON.parse(content) }
    }).catch(err => {
      // postcss-load-config throws error when no config file is found,
      // but for us it's optional. only emit other errors
      if (err.message.indexOf('No PostCSS Config found') >= 0) {
        return
      }
      loaderContext.emitWarning(`Error loading PostCSS config: ${err.message}`)
    })
  }

  return loaded.then(config => {
    let plugins = inlineConfig.plugins || []
    let options = inlineConfig.options || {}

    // merge postcss config file
    if (config && config.plugins) {
      plugins = plugins.concat(config.plugins)
    }
    if (config && config.options) {
      options = Object.assign({}, config.options, options)
    }

    return {
      plugins,
      options
    }
  })
}
