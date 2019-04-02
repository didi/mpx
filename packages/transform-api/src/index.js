
import { proxyWxToAliApi } from './platform'
import { error } from '../utils'

export default function install (target) {
  if (target.__mpx_used_promisify__) {
    error('如果同时使用 @mpxjs/transform-api 和 @mpxjs/promisify，请先使用 @mpxjs/transform-api')
  }
  /* eslint-disable-next-line camelcase, no-undef */
  if (__mpx_src_mode__ === 'wx' && __mpx_mode__ === 'ali') {
    proxyWxToAliApi(target)
  }
}
