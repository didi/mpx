module.exports = (loaders, loaderIndex) => {
  for (let i = loaderIndex; i >= 0; i--) {
    const currentLoader = loaders[i]
    if (currentLoader.path.endsWith('node_modules/ts-loader/dist/stringify-loader.js')) {
      return i
    }
  }
  return loaderIndex
}
