
module.exports = class PackageEntryPlugin {
  constructor (source, miniNpmPackage, target) {
    this.source = source
    this.target = target
    this.miniNpmPackage = miniNpmPackage
  }

  apply (resolver) {
    const target = resolver.ensureHook(this.target)
    resolver.getHook(this.source).tapAsync('PackagePlugin', (request, resolveContext, callback) => {
      const innerRequest = request.request || request.path
      if (!innerRequest) return callback()
      const descriptionFileData = request.descriptionFileData || {}
      /**
       * 判断是否需要更改innerRequest
       * 小程序发布npm包约束: package.json配置miniprogram 或默认 miniprogram_dist目录
       * 1. 用户配置了要解析的npm包, miniNpmPackage约束
       * 2. 当前资源包含package.json中同名name
       * 3. 用户未配置alias: @vant/weapp/lib
       * 4. 用户未直接引用 @vant/weapp/lib/下的资源
      */
      const { name, miniprogram = 'miniprogram_dist' } = descriptionFileData
      const strEntry = (name + '/' + miniprogram + '/').replace(/(\/+)/g, '/')
      if (this.miniNpmPackage.includes(name) && innerRequest.indexOf(name) !== -1 && innerRequest.indexOf(strEntry) === -1) {
        let newRequest = innerRequest.replace(name, strEntry)
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
