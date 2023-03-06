import set from './set'
const selectorPath = '@mpxjs/loaders/selector-loader.js'
const scriptSetupPath = '@mpxjs/loaders/script-setup-loader.js'
const webMpxLoaderPath = '@mpxjs/web-plugin/webpack/loader/web-loader.js'
const mpxLoaderPath = '@mpxjs/webpack-plugin/lib/loader.js'
const tsLoaderWatchRunFilterLoaders = new Set([
  selectorPath,
  scriptSetupPath,
  mpxLoaderPath,
  webMpxLoaderPath,
  'node_modules/vue-loader/lib/index.js'
])

export function tsWatchRunLoaderFilter (loaders: Array<Record<string, any>>, loaderIndex: number) {
  for (let len = loaders.length; len > 0; --len) {
    const currentLoader = loaders[len - 1]
    if (!set.has(tsLoaderWatchRunFilterLoaders, filterLoaderPath => currentLoader.path.endsWith(filterLoaderPath))) {
      break
    }
    loaderIndex--
  }
  return loaderIndex
}
