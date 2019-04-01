
import { proxyWxToAliApi } from './platform'

export default function install () {
  /* eslint-disable-next-line camelcase, no-undef */
  if (__mpx_src_mode__ === 'wx' && __mpx_mode__ === 'ali') {
    proxyWxToAliApi()
  }
}
