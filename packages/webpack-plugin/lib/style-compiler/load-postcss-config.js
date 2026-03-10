const load = require('postcss-load-config')
const loadPlugins = require('postcss-load-config/src/plugins')

let loaded

function formatPlugins (plugins, file) {
  return plugins ? loadPlugins({ plugins }, file) : []
}

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
      loaderContext.emitWarning(`[Mpx style warning]: Error loading PostCSS config: ${err.message}`)
    })
  }

  return loaded.then((config = {}) => {
    let plugins = formatPlugins(inlineConfig.plugins, inlineConfig.inlineConfigFile)
    let prePlugins = formatPlugins(inlineConfig.mpxPrePlugins, inlineConfig.inlineConfigFile)
    let options = inlineConfig.options || {}

    // merge postcss config file
    if (config.plugins) {
      plugins = plugins.concat(config.plugins)
    }
    if (config.options) {
      if (config.options.mpxPrePlugins) {
        // 使入参和postcss格式保持一致
        prePlugins = prePlugins.concat(formatPlugins(config.options.mpxPrePlugins, config.file))
        delete config.options.mpxPrePlugins
      }
      options = Object.assign({}, config.options, options)
    }

    return {
      prePlugins,
      plugins,
      options
    }
  })
}
