import promisifyList from './promisify'
export default function install (proxyMPX) {
  Object.assign(proxyMPX, promisifyList)
}
