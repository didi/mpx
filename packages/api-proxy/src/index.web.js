import * as allApi from './web/api'
import promisify from './mini/promisify'
import { genFromMap } from './common/js'

export default function install (target, options = {}) {
  const {
    usePromise = false, // 是否转为 promise 格式
    whiteList = [], // 强制变成 promise 格式的 api
    blackList = [] // 强制不变成 promise 格式的 api
  } = options
  const fromMap = genFromMap()
  const promisedApi = usePromise ? promisify(allApi, whiteList, blackList) : {}
  const finalApi = Object.assign({}, allApi, promisedApi)
  Object.keys(finalApi).forEach(api => {
    target[api] = function (...args) {
      if (args.length > 0) {
        const from = args.pop()
        if (typeof from !== 'string' || !fromMap[from]) {
          args.push(from)
        }
      }

      return finalApi[api].apply(target, args)
    }
  })
}
export function getProxy () {
  const apiProxy = {}
  install(apiProxy)
  return apiProxy
}
