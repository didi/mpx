const path = require('path')
/**
 * @desc 获取小程序npm包资源入口目录
 */
const getEntry = (name, miniprogram) => {
  return path.join(name, miniprogram)
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
      if (!innerRequest || request.miniprogram) return callback()

      const descriptionFileData = request.descriptionFileData || {}
      const { name = '', miniprogram } = descriptionFileData
      let newEntry = ''
      // request.path和系统环境有关：windows和linux
      let normalizedName = path.normalize(name)
      if (innerRequest.indexOf(normalizedName) === -1) {
        return callback()
      }
      if (miniprogram) {
        newEntry = getEntry(normalizedName, miniprogram)
      } else if (this.miniNpmPackage.includes(name)) {
        newEntry = getEntry(normalizedName, 'miniprogram_dist')
      }

      if (newEntry) {
        const newRequest = innerRequest.replace(normalizedName, newEntry)
        const obj = Object.assign({}, request, {
          request: newRequest,
          miniprogram: true
        })
        resolver.doResolve(target, obj, `change request ${innerRequest} to :` + newRequest, resolveContext, callback)
      } else {
        callback()
      }
    })
  }
}
