import { proxyWxToAliApi, wxToAliApi } from './wxToAli'

function proxyApi () {
  /* eslint-disable */
  if (__mpx_src_mode__ === 'wx' && __mpx_mode__ === 'ali') {
    proxyWxToAliApi()
  }
  /* eslint-enable */
}

export {
  wxToAliApi,
  proxyApi
}
