import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import { mergeLifecycle } from './mergeLifecycle'
const NOTSUPPORTS = ['moved', 'externalClasses', 'pageLifetimes', 'definitionFilter']
function notSupportTip (options) {
  NOTSUPPORTS.forEach(key => {
    if (options[key]) {
      global.currentResource && console.error(`【MPX CONVERT ERROR】at ${global.currentResource}:`)
      console.error(`Don't support for convert the option【${key}】 of the wx-component into the ali-component`)
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
        if (prop && prop.hasOwnProperty('value')) {
          newProps[key] = prop.value
        } else {
          newProps[key] = typeof prop === 'function' ? prop() : ''
        }
      })
      options.props = newProps
      delete options.properties
    }
    notSupportTip(options)
  }
}
