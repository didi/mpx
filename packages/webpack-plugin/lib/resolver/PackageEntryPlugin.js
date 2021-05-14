const path = require('path')
/**
 * @desc 获取小程序npm包资源入口目录
*/
const getEntry = (name, miniprogram) => {
  return path.join(name, miniprogram)
}
/**
 * @desc 获取相对路径, relativePath无论是linux和window，都是'./button/index' 形式, 不会存在'.\button'反斜杠
*/
const getRelativePath = (sourcePath, miniprogram) => {
  if (!sourcePath) return sourcePath
  const reg = /([./]+)([^./]+)/
  const result = sourcePath.match(reg)
  return result[1] + miniprogram + '/' + result[2]
}

module.exports = class PackageEntryPlugin {
  constructor (source, miniNpmPackage, target) {
    this.source = source
    this.target = target
    this.miniNpmPackage = miniNpmPackage
  }
  /**
   * 判断是否需要更改innerPath
   * 小程序发布npm包约束: package.json配置miniprogram 或默认 miniprogram_dist目录
   * 0. 前提: request中含有package.json中name字段
   * 1. package.json中配置了miniprogram, 且request中不含miniprogram，尝试拼接
   * 2. 用户配置miniNpmPackage说明是小程序npm包，如果package.json中没配置miniprogram字段，则尝试拼接默认miniprogram_dist目录
  */
  apply (resolver) {
    const target = resolver.ensureHook(this.target)
    resolver.getHook(this.source).tapAsync('PackagePlugin', (request, resolveContext, callback) => {
      const innerPath = request.path
      if (!innerPath) return callback()

      const descriptionFileData = request.descriptionFileData || {}
      const { name, miniprogram } = descriptionFileData
      let strEntry = ''
      // request.path和系统环境有关：windows和linux
      let newName = path.normalize(name)
      if (innerPath.indexOf(newName) === -1) {
        return callback()
      }
      if (miniprogram) {
        strEntry = getEntry(newName, miniprogram)
      } else if (this.miniNpmPackage.includes(newName)) {
        strEntry = getEntry(newName, 'miniprogram_dist')
      }

      if (strEntry && innerPath.indexOf(strEntry) === -1) {
        const newPath = innerPath.replace(newName, strEntry)
        const relativePath = getRelativePath(request.relativePath, miniprogram || 'miniprogram_dist')
        const obj = Object.assign({}, request, {
          path: newPath,
          relativePath
        })

        resolver.doResolve(target, obj, `change path ${innerPath} to :` + newPath, resolveContext, (err, result) => {
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
