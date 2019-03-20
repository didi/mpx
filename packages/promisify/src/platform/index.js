import { proxyMyApi, wxToMyApis } from './wxToMy'

function proxyApi (target, platform = {}) {
  if (platform.from === 'wx' && platform.to === 'my') {
    proxyMyApi(target)
  }
}

export {
  wxToMyApis,
  proxyApi
}
