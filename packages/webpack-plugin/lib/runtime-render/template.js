const { wx } = require('../config')

const directives = new Set(
  Object.keys(wx.directive).map((key) => wx.directive[key])
)

class BaseTemplate {
  constructor() {
    this.normalElementMap = {}
  }

  setNormalElement(el) {
    const tag = el.tag
    const attrKeys = Object.keys(el.attrsMap).filter(
      (key) => !directives.has(key)
    )
    if (tag && !this.normalElementMap[tag]) {
      this.normalElementMap[tag] = {
        attrKeys: new Set(attrKeys)
      }
    } else {
      attrKeys.map((key) => this.normalElementMap[tag].attrKeys.add(key))
    }
  }

  buildTemplate() {
    let template = this.buildBaseTemplate()
    let baseLevel = 2
    for (let i = 0; i < baseLevel; i++) {
      template += this.buildOptimizeFloor(i, this.baseLevel === i + 1)
    }

    return template
  }

  buildBaseTemplate() {
    return `
<template name="mpx_tmpl">
  <block wx:for="{{r.children}}" wx:key="index">
    <template is="tmpl_0_container" data="{{i: item}}"></template>
  </block>
</template>
    `
  }

  genNormalElementTemplate() {}

  buildOptimizeFloor(level = 3, restart) {
    let template = ['view', 'text'].reduce((current) => {
      return current + this.buildComponentTemplate(level)
    }, '')
    if (level === 0) template += this.buildPlainTextTemplate(level)
    template += this.buildContainerTemplate(level)

    return template
  }

  buildPlainTextTemplate(level) {
    return `
<template name="tmpl_${level}_text" data="{{i:i}}">
  <block>{{ i.text }}</block>
</template>
    `
  }

  buildContainerTemplate(level, restart) {
    let tmpl = ''
    if (restart) {
      tmpl = `<block wx:if="{{ i.nodeType === 'text' }}">
    <template is="tmpl_0_text" data="{{ i:i }}"></template>
  </block>
  <block wx:else>
    <comp i="{{i}}"></comp>
  </block>`
    } else {
      tmpl = `<template is="{{ 'tmpl_${level}_' + i.nodeType }}"></template>`
    }
    
    return `
<template name="tmpl_${level}_container">
  ${tmpl}
</template>
    `
  }

  buildComponentTemplate() {
    return this.buildStandardComponentTemplate()
  }

  buildStandardComponentTemplate() {

  }

  genRuntimeComponentTemplate() {}

  genNormalComponentTemplate() {}
}

const baseTemplate= new BaseTemplate()

console.log(baseTemplate.buildTemplate())
