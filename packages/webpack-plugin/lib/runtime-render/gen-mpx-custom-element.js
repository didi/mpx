const fs = require('fs')
const path = require('path')

const content = `
<template>
  <wxs module="xs" src="./utils.wxs"/>
</template>

<script>
// element 里面需要承载所有需要走运行时渲染的组件
import { createComponent } from '@mpxjs/core'

createComponent({
  options: {
    addGlobalClass: true,
    styleIsolation: 'shared',
    // todo: 超过基础模板的层数，virtualHost 置为 true，避免样式规则失效
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
</script>

<style>

</style>

<script type="application/json">
{
  "component": true
}
</script>
`

module.exports = function (packageName) {
  const filename = `mpx-custom-element-${packageName}`
  const filePath = path.resolve(__dirname, `${filename}.mpx`)
  const request = `${filePath}` + '?mpxCustomElement&isComponent'
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content)
  }
  return {
    request,
    outputPath: filename
  }
}
