import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import { mergeLifecycle } from './mergeLifecycle'
const NOTSUPPORTS = ['moved', 'relations']
function notSupportTip (options) {
  NOTSUPPORTS.forEach(key => {
    if (options[key]) {
      console.error(`不支持将微信组件属性${key}转换至支付宝小程序`)
      delete options[key]
    }
  })
}
export default {
  lifecycle: mergeLifecycle(wxLifecycle.LIFECYCLE),
  mode: 'blend',
  support: false,
  lifecycleProxyMap: {
    '__created__': ['created', 'attached'],
    '__mounted__': ['ready', 'onReady'],
    '__destroyed__': ['detached'],
    '__updated__': ['updated']
  },
  convert (options) {
    if (options.properties) {
      const newProps = {}
      Object.keys(options.properties).forEach(key => {
        const prop = options.properties[key]
        if (prop.hasOwnProperty('value')) {
          newProps[key] = prop.value
        } else {
          newProps[key] = prop()
        }
      })
      options.props = newProps
      delete options.properties
    }
    notSupportTip(options)
  }
}
