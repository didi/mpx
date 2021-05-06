
module.exports = class PackagePlugin {
  constructor (source, resolvePackList, target) {
    this.source = source
    this.target = target
    this.resolvePackList = resolvePackList
  }

  apply (resolver) {
    const target = resolver.ensureHook(this.target)
    // 仿照aliasPlugin
    resolver.getHook(this.source).tapAsync('PackagePlugin', (request, resolveContext, callback) => {
      const innerRequest = request.request || request.path;
      if (!innerRequest) return callback();
      let hit = false
      let newRequest = ''
      // 初始命不中, 两种方案：一种是直接添加options alias. 弊端开发人员可能会直接写@vant/weapp/dist 这种解析就有问题了， 第二种：请求的时候判断资源是否命中
      for (let key in this.resolvePackList) {
        let strEntry = (this.resolvePackList[key] || []).join('|')
        let prefixReg = new RegExp(`${key}/(${strEntry})/`)
        let newKey = (key + '/' + this.resolvePackList[key][0]).replace(/(\/+)/g, '/')
        // 初始req不带有package.json中的miniprogram字段 && 更改新的req后不能在命中此逻辑
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
          console.log(result)
          if (result === undefined) return callback(null, null);
          callback(null, result);
        })
      } else {
        callback()
      }
    })
  }
}
