// web专用mixin，在web中实现抽象节点功能
import { CREATED } from '../../core/innerLifecycle'

export default function componentGenericsMixin (mixinType) {
  if (global._gm && mixinType === 'component') {
    return {
      [CREATED] () {
        if (this.generichash && global._gm[this.generichash]) {
          Object.keys(global._gm[this.generichash]).forEach((name) => {
            const value = global._gm[this.generichash][name]
            this.$options.components[name] = value
          })
        }
      }
    }
  }
}
