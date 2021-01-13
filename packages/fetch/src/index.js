import XFetch from './xfetch'
import CancelToken from './cancelToken'

let installed = false

function install (proxyMPX, options, MPX) {
  if (installed) return
  const xfetch = new XFetch(options, MPX)
  installed = true
  proxyMPX.xfetch = xfetch
  Object.defineProperty(proxyMPX.prototype, '$xfetch', {
    get () {
      return xfetch
    }
  })
}

export { XFetch, CancelToken }

export default {
  install,
  XFetch,
  CancelToken
}
