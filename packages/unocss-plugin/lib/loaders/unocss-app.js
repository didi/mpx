const tsWatchRunLoaderFilter = require('@mpxjs/webpack-plugin/lib/utils/ts-loader-watch-run-loader-filter')
const path = require('path')
module.exports = function (source) {
  const pathExtname = path.extname(this.resourcePath)
  if (!['.vue', '.mpx'].includes(pathExtname)) {
    this.loaderIndex = tsWatchRunLoaderFilter(this.loaders, this.loaderIndex)
    return source
  }
  // 处理app引入
  return `
${source}
<style>
  @import "uno.css";
</style>`
}
