import parseRequest from './parse-request'
import { LoaderContext } from 'webpack'

type LoaderContextResolveCallback = Parameters<LoaderContext<null>['resolve']>[2]
// todo 提供不记录dependency的resolve方法，非必要的情况下不记录dependency，提升缓存利用率
export default function resolve(context: string,
                                request: string,
                                loaderContext: LoaderContext<null>,
                                callback: LoaderContextResolveCallback) {
  const { queryObj } = parseRequest(request)
  context = queryObj.context || context
  return loaderContext.resolve(context, request, (err, resource, info) => {
    if (err) return callback(err)
    if (resource === false) return callback(new Error('Resolve ignored!'))
    callback(null, resource, info)
  })
}
