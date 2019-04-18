import { proxyWxToAliApi } from './platform/index'
import proxyAll from './proxy'
import getPromisifyList from './promisify'

export default function install (target, options = {}) {
  const {
    platform = {}, // 转换的平台
    exclude = [], // 转换平台时不转换的 Api
    usePromise = false, // 是否转为 promise 格式
    whiteList = [] // 不变成 promise 格式的 api
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
  proxyAll(target)

  // 转换各端 api
  if (from === 'wx' && to === 'ali') {
    proxyWxToAliApi(target, exclude)
  }

  // 变为 promise 格式
  if (usePromise) {
    Object.assign(target, getPromisifyList(whiteList, from, to, exclude))
  }
}
