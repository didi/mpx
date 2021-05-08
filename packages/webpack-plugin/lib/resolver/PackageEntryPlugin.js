/**
 * @desc 获取小程序npm包资源入口目录
*/
const getEntry = (name, miniprogram) => {
  return (name + '/' + miniprogram + '/').replace(/(\/+)/g, '/')
}

module.exports = class PackageEntryPlugin {
  constructor (source, miniNpmPackage, target) {
    this.source = source
    this.target = target
    this.miniNpmPackage = miniNpmPackage
  }
  /**
   * 判断是否需要更改innerRequest
   * 小程序发布npm包约束: package.json配置miniprogram 或默认 miniprogram_dist目录
   * 0. 前提: request中含有package.json中name字段
   * 1. package.json中配置了miniprogram, 且request中不含miniprogram，尝试拼接
   * 2. 用户配置miniNpmPackage说明是小程序npm包，如果package.json中没配置miniprogram字段，则尝试拼接默认miniprogram_dist目录   
  */
  apply (resolver) {
    const target = resolver.ensureHook(this.target)
    resolver.getHook(this.source).tapAsync('PackagePlugin', (request, resolveContext, callback) => {
      const innerRequest = request.request || request.path
      if (!innerRequest) return callback()

      const descriptionFileData = request.descriptionFileData || {}
      const { name, miniprogram } = descriptionFileData
      let strEntry = ''
      if (innerRequest.indexOf(name) === -1) {
        return callback()
      }

      if (miniprogram) {
        strEntry = getEntry(name, miniprogram)
      } else if (this.miniNpmPackage.includes(name)){
        strEntry = getEntry(name, 'miniprogram_dist')
      }

      if (strEntry && innerRequest.indexOf(strEntry) === -1) {
        const newRequest = innerRequest.replace(name, strEntry)
        const obj = Object.assign({}, request, {
          request: newRequest
        })
        resolver.doResolve(target, obj, `change request ${innerRequest} to :` + newRequest, resolveContext, (err, result) => {
          if (err) return callback(err)
          if (result === undefined) return callback(null, null)
          callback(null, result)
        })
      } else {
        callback()
      }
    })
  }
}
