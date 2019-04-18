import { proxyWxToAliApi } from './platform'
import proxyAll from './proxy'
import getPromisifyList from './promisify'

export default function install (target, options = {}) {
  const usePromise = !!options.usePromise
  const whiteList = options.whiteList || []
  const platform = options.platform || {}
  let from = platform.from
  let to = platform.to

  /* eslint-disable camelcase, no-undef */
  if (typeof __mpx_src_mode__ !== 'undefined') {
    from = __mpx_src_mode__
  }
  if (typeof __mpx_mode__ !== 'undefined') {
    to = __mpx_mode__
  }
  /* eslint-enable */

  // 代理所有 api
  proxyAll(target)

  // 转换各端 api
  if (from === 'wx' && to === 'ali') {
    proxyWxToAliApi(target)
  }

  // 变为 promise 格式
  if (usePromise) {
    Object.assign(target, getPromisifyList(whiteList, from, to))
  }
}
