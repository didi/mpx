import * as platformApi from './platform'
import { getEnvObj, getEnvStr } from './common/js'
import promisify from './common/js/promisify'

export default function install (target, options = {}) {
  const {
    usePromise = false, // 是否转为 promise 格式
    whiteList = [], // 强制变成 promise 格式的 api
    blackList = [], // 强制不变成 promise 格式的 api
    custom = {}, // 自定义转化规则
    fallbackMap = {} // 对于不支持的API，允许配置一个映射表，接管不存在的API
  } = options

  let transedApi = {}
  const envStr = getEnvStr()

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
  if (custom[envStr]) {
    Object.keys(custom[envStr])
      .forEach(k => {
        target[k] = (...args) => {
          return custom[envStr][k].apply(target, args)
        }
      })
  }
  // Fallback Map option
  Object.keys(fallbackMap)
    .forEach(k => {
      if (!target[k]) {
        target[k] = fallbackMap[k]
      }
    })
}
