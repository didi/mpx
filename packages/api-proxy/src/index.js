import proxyAll from './proxy-all'
import transformApi from './platform/index'

export default function install (target, options = {}) {
  const {
    usePromise = false, // 是否转为 promise 格式
    whiteList = [], // 不变成 promise 格式的 api
    platform = {},
    exclude = [], // 转换平台时不转换的 Api
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

  // 代理所有 api
  proxyAll(target, usePromise, whiteList)

  // 转换各端 api
  transformApi(target, {
    usePromise,
    whiteList,
    exclude,
    from,
    to,
    optimize
  })

  // Fallback Map option
  Object.keys(fallbackMap)
    .forEach(k => {
      if (!target[k]) {
        target[k] = fallbackMap[k]
      }
    })
}
