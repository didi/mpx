import * as wxLifecycle from '../platform/patch/wx/lifecycle'
import { mergeLifecycle } from './mergeLifecycle'
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
  convert(options) {
    if (options.properties) {
      const newProps = {}
      Object.keys(options.properties).forEach(key => {
        const prop = options.properties[key]
        if (prop.value) {
          newProps[key] = prop.value
        }
      })
      options.properties = newProps
    }
  }