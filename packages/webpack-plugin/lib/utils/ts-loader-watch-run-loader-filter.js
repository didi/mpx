const toPosix = require('./to-posix')

module.exports = (loaders, loaderIndex) => {
  for (let i = loaderIndex; i >= 0; i--) {
    const currentLoader = loaders[i]
    const currentLoaderPath = toPosix(currentLoader.path)
    if (currentLoaderPath.endsWith('node_modules/ts-loader/dist/stringify-loader.js')) {
      return i
    }
  }
  return loaderIndex
}
