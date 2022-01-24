module.exports = `
<template>
  <view></view>
</template>

<script>
// element 里面需要承载所有需要走运行时渲染的组件
import { createComponent } from '@mpxjs/core'

createComponent({
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared'
  },
  properties: {
    r: { // 递归渲染数据
      type: Object,
      value: {
        nodeType: 'block'
      }
    }
  },
  data: {
    // 运行时组件的标识
    mpxCustomElement: true
  },
  computed: {
    vnodeData () {
      const data = this.r.data || {}
      return data
    },
    // 组件所处的根 uid
    rootUid () {
      return this.vnodeData.rootUid
    },
    // 当前组件的 uid
    uid () {
      return this.vnodeData.uid
    }
  }
})
</script>

<style>

</style>

<script type="application/json">
{
  component: true
}
</script>
`
