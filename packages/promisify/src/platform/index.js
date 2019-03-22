import { proxyWxToAliApi, wxToAliApi } from './wxToAli'

function proxyApi (platform = {}) {
  if (platform.from === 'wx' && platform.to === 'ali') {
    proxyWxToAliApi()
  }
}

export {
  wxToAliApi,
  proxyApi
}
