// web专用mixin，在web中实现抽象节点功能
import { CREATED } from '../../core/innerLifecycle'

export default function componentGenericsMixin (mixinType) {
  if (global.__mpxGenericsMap && mixinType === 'component') {
    return {
      [CREATED] () {
        if (this.generichash && global.__mpxGenericsMap[this.generichash]) {
          Object.keys(global.__mpxGenericsMap[this.generichash]).forEach((name) => {
            const value = global.__mpxGenericsMap[this.generichash][name]
            this.$options.components[name] = value
          })
        }
      }
    }
  }
}
