import * as platformApi from './platform'
import { ENV_OBJ } from './common/js'
import promisify from './common/js/promisify'

export default function install (target, options = {}) {
  const {
    usePromise = false, // 是否转为 promise 格式
    whiteList = [], // 强制变成 promise 格式的 api
    blackList = [], // 强制不变成 promise 格式的 api
    custom = {} // 自定义转化规则
  } = options
  const transedApi = Object.assign({}, ENV_OBJ, platformApi)
  const promisedApi = usePromise ? promisify(transedApi, whiteList, blackList) : {}
  Object.assign(target, transedApi, promisedApi, custom[__mpx_mode__])
}

export function getProxy (options = {}) {
  const apiProxy = {}
  install(apiProxy, options)
  return apiProxy
}
