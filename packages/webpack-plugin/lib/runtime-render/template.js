const {
  UnRecursiveTemplate,
  RecursiveTemplate
} = require('@mpxjs/template-engine')

const recursiveTemplate = new RecursiveTemplate()
const unRecursiveTemplate = new UnRecursiveTemplate()

module.exports.buildTemplate = function (mode, config) {
  const isAli = mode === 'ali'
  const template = isAli ? recursiveTemplate : unRecursiveTemplate
  return template.buildTemplate({
    ...config,
    inlineSlot: isAli
  })
}
