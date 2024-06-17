import { createComponent } from '@mpxjs/core'

createComponent({
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
    // 超过基础模板的层数，virtualHost 置为 true，避免样式规则失效
    virtualHost: true
  },
  properties: {
    r: { // vdom 数据
      type: Object,
      value: {
        nt: 'block'
      }
    }
  },
  data: {
    // 运行时组件的标识
    mpxCustomElement: true
  },
  computed: {
    vnodeData () {
      const data = this.r.d || {}
      return data
    },
    // 当前组件的 uid
    uid () {
      return this.vnodeData.uid
    }
  }
})
