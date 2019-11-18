import transformApi from './transform'
import promisify from './promisify'

export default function install (target, options = {}) {
  const {
    usePromise = false, // 是否转为 promise 格式
    whiteList = [], // 不变成 promise 格式的 api
    platform = {},
    exclude = [], // 转换平台时不转换的 Api
    custom = {}, // 自定义转化规则
    fallbackMap = {}, // 对于不支持的API，允许配置一个映射表，接管不存在的API
    optimize = false // 内部一些实验优化的开关，外部用户慎用
  } = options

  let { from = '', to = '' } = platform
  /* eslint-disable camelcase, no-undef */
  if (typeof __mpx_src_mode__ !== 'undefined') {
    from = __mpx_src_mode__
  }
  if (typeof __mpx_mode__ !== 'undefined') {
    to = __mpx_mode__
  }
  /* eslint-enable */

  const transedApi = transformApi({
    exclude,
    from,
    to,
    custom,
    optimize
  })

  const promisedApi = usePromise ? promisify(transedApi, whiteList) : {}
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
    } catch (e) {} // 支付宝不支持重写 call 方法
  })

  // Fallback Map option
  Object.keys(fallbackMap)
    .forEach(k => {
      if (!target[k]) {
        target[k] = fallbackMap[k]
      }
    })
}
