const parseRequest = require('./parse-request')
const { RESOLVE_IGNORED_ERR } = require('./const')

// todo 提供不记录dependency的resolve方法，非必要的情况下不记录dependency，提升缓存利用率
module.exports = (context, request, loaderContext, callback) => {
  const { queryObj } = parseRequest(request)
  context = queryObj.context || context
  return loaderContext.resolve(context, request, (err, resource, info) => {
    if (err) return callback(err)
    if (resource === false) return callback(RESOLVE_IGNORED_ERR)
    callback(null, resource, info)
  })
}
