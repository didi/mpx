import getPromisifyList from './promisify'
import { proxyApi } from './platform'

export default function install (proxyMPX, whiteList) {
  proxyApi()
  Object.assign(proxyMPX, getPromisifyList(whiteList))
}
