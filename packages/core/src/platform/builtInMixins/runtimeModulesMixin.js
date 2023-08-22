import { CREATED } from '../../core/innerLifecycle'
import { reactive } from '../../observer/reactive'
import { proxy } from '@mpxjs/utils'
import staticMap from '../../vnode/staticMap'

export default function getRuntimeModulesMixin () {
  return {
    [CREATED] () {
      const runtimeModules = this.__getRuntimeModules && this.__getRuntimeModules()
      if (runtimeModules?.length) {
        runtimeModules.forEach(({ id }) => {
          const val = { [id]: false }
          reactive(val)
          this.__mpxProxy.collectLocalKeys(val)
          proxy(this, val)
          // 通过插件的形式由业务自行挂载
          if (this.mpxLoadJson) {
            this.mpxLoadJson().then(data => {
              this[id] = true
              staticMap[id] = data[id]
            }).catch(e => {
              // do something
            })
          }
        })
      }
    }
  }
}
