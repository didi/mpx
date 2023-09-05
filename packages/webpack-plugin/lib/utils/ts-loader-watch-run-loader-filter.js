module.exports = (loaders, loaderIndex) => {
  for (let len = loaders.length; len > 0; --len) {
    const currentLoader = loaders[len - 1]
    if (currentLoader.path.endsWith('ts-loader/dist/stringify-loader.js')) {
      break
    }
    loaderIndex--
  }
  return loaderIndex
}
