import transformApi from './mini/transform'
import promisify from './mini/promisify'

export default function install (target, options = {}) {
  const {
    usePromise = false, // 是否转为 promise 格式
    whiteList = [], // 强制变成 promise 格式的 api
    blackList = [], // 强制不变成 promise 格式的 api
    platform = {},
    exclude = ['shareImageMessage'], // 强制不进行代理的api，临时fix微信分享朋友圈白屏
    custom = {}, // 自定义转化规则
    fallbackMap = {}, // 对于不支持的API，允许配置一个映射表，接管不存在的API
    optimize = false // 内部一些实验优化的开关，外部用户慎用
  } = options

  let { from = '', to = '' } = platform
  /* eslint-disable camelcase, no-undef */
  if (typeof __mpx_src_mode__ !== 'undefined') {
    if (from && from !== __mpx_src_mode__) {
      console.warn && console.warn('platform key from nnconsistent with the current environment value\n')
    }
    from = `__mpx_src_mode_${__mpx_src_mode__}__`
  } else {
    if (!from) {
      // 报warning 无from 参数走默认 wx
      from = 'wx'
      console.warn && console.warn('the platform from field is empty, wx will be used by default\n')
    }
    from = `__mpx_src_mode_${from}__`
  }

  if (typeof __mpx_mode__ !== 'undefined') {
    to = __mpx_mode__
  } else if (!to) {
    console.warn && console.warn('the platform to field is empty, ali will be used by default\n')
    to = 'ali'
  }
  /* eslint-enable */

  const transedApi = transformApi({
    exclude,
    from,
    to,
    custom,
    optimize
  })

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

  // Fallback Map option
  Object.keys(fallbackMap)
    .forEach(k => {
      if (!target[k]) {
        target[k] = fallbackMap[k]
      }
    })
}

export function getProxy(options = {}) {
  let apiProxy = {}
  install(apiProxy, options)
  return apiProxy
}
