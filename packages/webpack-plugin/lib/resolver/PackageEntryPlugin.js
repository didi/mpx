const path = require('path')
const toPosix = require('../utils/to-posix')

module.exports = class PackageEntryPlugin {
  constructor (source, miniNpmPackages, target) {
    this.source = source
    this.target = target
    this.miniNpmPackages = miniNpmPackages
  }

  /**
   * 判断是否需要更改innerRequest
   * 小程序发布npm包约束: package.json配置miniprogram 或默认 miniprogram_dist目录
   * 1. package.json中配置了miniprogram, 且request中不含miniprogram，尝试拼接
   * 2. 用户配置miniNpmPackages说明是小程序npm包，如果package.json中没配置miniprogram字段，则尝试拼接默认miniprogram_dist目录
   */
  apply (resolver) {
    const target = resolver.ensureHook(this.target)
    resolver.getHook(this.source).tapAsync('PackageEntryPlugin', (request, resolveContext, callback) => {
      if (request.miniprogram) return callback()
      const { path: resourcePath, descriptionFileData, descriptionFileRoot } = request
      if (request.miniprogram || !descriptionFileData) return callback()

      let { name, miniprogram } = descriptionFileData
      if (!miniprogram && this.miniNpmPackages.includes(name)) miniprogram = 'miniprogram_dist'
      if (!miniprogram) return callback()

      let relativePath = path.relative(descriptionFileRoot, resourcePath)
      if (relativePath.startsWith(miniprogram)) return callback()

      relativePath = path.join(miniprogram, relativePath)

      const obj = Object.assign({}, request, {
        path: path.join(descriptionFileRoot, relativePath),
        relativePath: './' + toPosix(relativePath),
        miniprogram: true
      })
      if (obj.path === resourcePath) return callback()

      resolver.doResolve(target, obj, 'add miniprogram dist: ' + miniprogram, resolveContext, callback)
    })
  }
}
