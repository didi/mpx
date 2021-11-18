const UnRecursiveTemplate = require('@mpxjs/template-engine').UnRecursiveTemplate

class Template extends UnRecursiveTemplate {
  constructor () {
    super()
    // this.supportXS = true
  }

  // todo 优化 wxs 模块
  // buildXsTemplate () {
  //   return '<wxs module="xs" src="./utils.wxs" />'
  // }
}

const unRecursiveTemplate = new Template()

module.exports = {
  unRecursiveTemplate
}
