import * as wxLifecycle from './patch/wx/lifecycle'
import * as aliLifecycle from './patch/ali/lifecycle'
import { is } from '../helper/env'
import { type } from '../helper/utils'
const lifecycle = is('ali') ? aliLifecycle : wxLifecycle

export function getLifecycleOptions () {
  const lifecycleProxyMap = lifecycle.lifecycleProxyMap
  const options = {}
  Object.keys(lifecycleProxyMap).forEach(key => {
    options[key] = function (...rest) {
      let val = lifecycleProxyMap[key]
      if (type(val) !== 'Array') {
        val = [val]
      }
      val.forEach(lifecycle => {
        const rawOptions = this.$rawOptions || {}
        // wx小程序blend模式时页面生命周期写在methods里面
        const methods = (!is('ali') && rawOptions.methods) || {}
        const fn = rawOptions[lifecycle] || methods[lifecycle]
        typeof fn === 'function' && fn.apply(this, rest)
      })
    }
  })
  return options
}

export default lifecycle
