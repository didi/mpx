import { proxyWxToAliApi } from './platform'
import getPromisifyList from './promisify'

export default function install (target, options = {}) {
  const usePromise = !!options.usePromise
  const whiteList = options.whiteList || []
  const platform = options.platform || {}
  let from = platform.from
  let to = platform.to

  /* eslint-disable camelcase, no-undef */
  if (typeof __mpx_src_mode__ !== 'undefined') {
    fromMode = __mpx_src_mode__
  }
  if (typeof __mpx_mode__ !== 'undefined') {
    toMode = __mpx_mode__
  }
  /* eslint-enable */

  if (from === 'wx' && to === 'ali') {
    proxyWxToAliApi(target)
  }
  if (usePromise) {
    Object.assign(target, getPromisifyList(whiteList, from, to))
  }
}
