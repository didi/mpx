import XFetch from './xfetch'
import CancelToken from './cancelToken'

let installed = false

let xfetch = null

function install (proxyMpx, options, Mpx) {
  if (installed) return
  // add request queue when mode is qq
  xfetch = __mpx_mode__ === 'qq'
    ? new XFetch(Object.assign({
      // RequestQueue Options
      useQueue: {
        limit: 10,
        delay: 0 // ms
      }
    }, options), Mpx)
    : new XFetch(options, Mpx)
  installed = true
  proxyMpx.xfetch = xfetch
  Object.defineProperty(proxyMpx.prototype, '$xfetch', {
    get () {
      return xfetch
    }
  })
}

function useFetch (options) {
  if (options) {
    return new XFetch(options)
  } else if (xfetch) {
    return xfetch
  } else {
    console.error('useFetch method calls must be made after the @mpxjs/fetch plugin is used')
  }
}

export { XFetch, CancelToken }

export default {
  install,
  XFetch,
  CancelToken,
  useFetch
}
