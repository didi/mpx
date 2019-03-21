import getPromisifyList from './promisify'
import { proxyApi } from './platform'

export default function install (proxyMPX, whiteList, platform) {
  proxyApi(platform)
  Object.assign(proxyMPX, getPromisifyList(whiteList))
}
