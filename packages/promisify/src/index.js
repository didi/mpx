import getPromisifyList from './promisify'

export default function install (proxyMPX, whiteList) {
  Object.assign(proxyMPX, getPromisifyList(proxyMPX, whiteList))
  proxyMPX.__mpx_used_promisify__ = true
}
