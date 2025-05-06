// web专用mixin，在web中实现抽象节点功能
import { CREATED } from '../../core/innerLifecycle'

export default function componentGenericsMixin (mixinType) {
  if (mpxGlobal.__mpxGenericsMap && mixinType === 'component') {
    return {
      [CREATED] () {
        if (this.generichash && mpxGlobal.__mpxGenericsMap[this.generichash]) {
          Object.keys(mpxGlobal.__mpxGenericsMap[this.generichash]).forEach((name) => {
            const value = mpxGlobal.__mpxGenericsMap[this.generichash][name]
            this.$options.components[name] = value
          })
        }
      }
    }
  }
}
