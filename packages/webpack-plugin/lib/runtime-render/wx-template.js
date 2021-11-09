const UnRecursiveTemplate = require('/Users/didi/project/mpx-group/template-engine/dist/template').UnRecursiveTemplate

class Template extends UnRecursiveTemplate {
  constructor () {
    super()
    // this.supportXS = true
  }

  // buildXsTemplate () {
  //   return '<wxs module="xs" src="./utils.wxs" />'
  // }
}

const unRecursiveTemplate = new Template()

module.exports = {
  unRecursiveTemplate
}
