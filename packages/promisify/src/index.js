import getPromisifyList from './promisify'

export default function install (proxyMPX, whiteList) {
  Object.assign(proxyMPX, getPromisifyList(whiteList))
}
