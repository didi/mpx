import proxyAll from './proxy-all'
import transformApi from './platform/index'

export default function install (target, options = {}) {
  const {
    usePromise = false, // 是否转为 promise 格式
    whiteList = [], // 不变成 promise 格式的 api
    platform = {},
    exclude = [] // 转换平台时不转换的 Api
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
    to
  })
}
