import XFetch from './xfetch'
import CancelToken from './cancelToken'

let installed = false

function install (proxyMPX, options, MPX) {
  if (installed) return
  // add request queue when mode is qq
  const xfetch = __mpx_mode__ === 'qq' ? new XFetch(Object.assign({
    // RequestQueue Options
    useQueue: {
      limit: 10,
      delay: 0 // ms
    }
  }, options), MPX) : new XFetch(options, MPX)
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
