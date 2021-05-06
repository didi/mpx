
module.exports = class PackagePlugin {
  constructor (source, resolvePackList, target) {
    this.source = source
    this.target = target
    this.resolvePackList = resolvePackList
  }

  apply (resolver) {
    const target = resolver.ensureHook(this.target)
    resolver.getHook(this.source).tapAsync('PackagePlugin', (request, resolveContext, callback) => {
      const innerRequest = request.request || request.path;
      if (!innerRequest) return callback();
      let hit = false
      let newRequest = ''
      /**
       * 判断是否需要更改innerRequest
       * 1. 用户资源不含有组件库package.json中入口目录(如vant组件库package.json中miniprogram字段)
       * 2. 用户直接配置alias: @vant/weapp/(dist|lib) 需要排除, 更改innerRequest后需要排除
      */
      for (let key in this.resolvePackList) {
        let strEntry = (this.resolvePackList[key] || []).join('|')
        let prefixReg = new RegExp(`${key}/(${strEntry})/`)
        let newKey = (key + '/' + this.resolvePackList[key][0]).replace(/(\/+)/g, '/')
        if (innerRequest.indexOf(key) !== -1 && !prefixReg.test(innerRequest)) {
          hit = true
          newRequest = innerRequest.replace(key, newKey)
        }

      }
      if (hit) {
        const obj = Object.assign({}, request, {
          request: newRequest
        });
        resolver.doResolve(target, obj, 'change request:' + newRequest, resolveContext, (err, result) => {
          if (err) return callback(err);
          if (result === undefined) return callback(null, null);
          callback(null, result);
        })
      } else {
        callback()
      }
    })
  }
}
