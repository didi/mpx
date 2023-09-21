import * as platformApi from './platform'
import { getEnvObj, promisify } from './common/js'

export default function install (target, options = {}) {
  const {
    usePromise = false, // 是否转为 promise 格式
    whiteList = [], // 强制变成 promise 格式的 api
    blackList = [], // 强制不变成 promise 格式的 api
  } = options

  let transedApi = {}

  if (__mpx_env__ === 'web') {
    transedApi = platformApi
  } else {
    const envObj = getEnvObj()
    Object.keys(envObj).concat(Object.keys(platformApi)).forEach((key) => {
      transedApi[key] = platformApi[key] || envObj[key]
    })
  }

  const promisedApi = usePromise ? promisify(transedApi, whiteList, blackList) : {}
  const allApi = Object.assign({}, transedApi, promisedApi)

  Object.keys(allApi).forEach(api => {
    try {
      if (typeof allApi[api] !== 'function') {
        target[api] = allApi[api]
        return
      }

      target[api] = (...args) => {
        return allApi[api].apply(target, args)
      }
    } catch (e) {
    } // 支付宝不支持重写 call 方法
  })
}
