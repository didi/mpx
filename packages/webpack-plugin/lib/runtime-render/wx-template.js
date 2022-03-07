const UnRecursiveTemplate = require('@mpxjs/template-engine').UnRecursiveTemplate

// class Template extends UnRecursiveTemplate {
//   constructor () {
//     super()
//     this.supportXS = true
//   }

//   buildXsTemplate () {
//     return '<wxs module="xs" src="./utils.wxs" />'
//   }
// }

const unRecursiveTemplate = new UnRecursiveTemplate()

module.exports = {
  unRecursiveTemplate
}
