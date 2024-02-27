const UnRecursiveTemplate =
  require('@mpxjs/template-engine').UnRecursiveTemplate
const RecursiveTemplate = require('@mpxjs/template-engine').RecursiveTemplate

const recursiveTemplate = new RecursiveTemplate()
const unRecursiveTemplate = new UnRecursiveTemplate()

module.exports = {
  getTemplate(mode) {
    if (mode === 'ali') return recursiveTemplate
    return unRecursiveTemplate
  }
}
