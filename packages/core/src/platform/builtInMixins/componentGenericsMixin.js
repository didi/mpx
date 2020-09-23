// web专用mixin，在web中实现抽象节点功能
export default function pageTitleMixin (mixinType) {
  if (global.__mpxGenericsMap && mixinType === 'component') {
    return {
      created () {
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
