import XMock from './xmock'
let installed = false
function install (proxyMPX, options = {}) {
  if (installed) return
  const xmock = new XMock(options)
  installed = true
  proxyMPX.xmock = xmock
  Object.defineProperty(proxyMPX.prototype, '$xmock', {
    get () {
      return xmock
    }
  })
}
export default {
  install,
  XMock
}
