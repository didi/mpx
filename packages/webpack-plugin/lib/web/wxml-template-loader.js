const normalize = require('@mpxjs/webpack-plugin/lib/utils/normalize')
const optionProcessorPath = normalize.lib('runtime/optionProcessor')
const shallowStringify = require('../utils/shallow-stringify')
const getTemplateContent = require('../utils/get-template-content')
const { stringifyRequest } = require('@mpxjs/webpack-plugin/lib/web/script-helper')
const WriteVfsDependency = require('../dependencies/WriteVfsDependency')

module.exports = function (content) {
  const regex = /<template[^>]*\sname\s*=\s*"([^"]*)"[^>]*>/g
  const mpx = this.getMpx()
  let match
  const templateNames = []

  while ((match = regex.exec(content)) !== null) {
    templateNames.push(match[1])
  }
  const templateMaps = {}
  templateNames.forEach((name, index) => {
    const cutContent = getTemplateContent(content, name)
    const resourcePath = this.resourcePath.replace(/.wxml$/, `-${name}.wxml`)
    this._module.addPresentationalDependency(new WriteVfsDependency(resourcePath, cutContent))
    mpx.__vfs.writeModule(resourcePath, cutContent)
    templateMaps[name] = `getComponent(require(${stringifyRequest(this, `${resourcePath}?is=${name}&localComponentsMap=${encodeURIComponent(JSON.stringify(mpx.parentLocalComponentsMap))}&isTemplate`)}))` // template2vue是在外部配置没办法拿到parentLocalComponentsMap，所以通过query传递
  })
  return `
  const {getComponent} = require(${stringifyRequest(this, optionProcessorPath)})\n
  module.exports = ${shallowStringify(templateMaps)}
  `
}
