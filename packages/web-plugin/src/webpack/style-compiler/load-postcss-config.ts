import { LoaderContext, WebpackError } from 'webpack'
import load, { ResultPlugin } from 'postcss-load-config'
import { Mpx } from '../mpx'

type Options = Record<string, any>

export default function loadPostcssConfig(
  loaderContext: LoaderContext<any>,
  inlineConfig: {
    config?: {
      path: string
      plugins: ResultPlugin[]
      options: Options
    }
    ignoreConfigFile?: boolean
    defs?: Mpx['defs']
    plugins?: ResultPlugin[]
    options?: Options
  } = {}
): Promise<{ plugins: ResultPlugin[]; options: Options }> {
  if (inlineConfig.ignoreConfigFile) {
    return Promise.resolve({
      plugins: [],
      options: {}
    })
  }

  const config = inlineConfig.config
  const ctx = {
    webpack: loaderContext,
    defs: inlineConfig.defs || {}
  } as any

  return load(ctx, config?.path, {
    loaders: { '.json': (_, content) => JSON.parse(content) }
  })
    .catch(err => {
      // postcss-load-config throws error when no config file is found,
      // but for us it's optional. only emit other errors
      if (err.message.indexOf('No PostCSS Config found') >= 0) {
        return
      }
      loaderContext.emitWarning(
        new WebpackError(`Error loading PostCSS config: ${err.message}`)
      )
    })
    .then(config => {
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
