import { proxyWxToAliApi, wxToAliApi } from './wxToAli'

function proxyApi (target, platform = {}) {
  if (platform.from === 'wx' && platform.to === 'ali') {
    proxyWxToAliApi(target)
  }
}

export {
  wxToAliApi,
  proxyApi
}
