const path = require('path')

module.exports = function (packageName) {
  const baseName = 'mpx-custom-element'
  const rawFile = baseName + (packageName === 'main' ? '-main' : '')
  const filePath = path.resolve(__dirname, `${rawFile}.mpx`)
  const request = `${filePath}?mpxCustomElement&isComponent&p=${packageName}`

  return {
    request,
    outputPath: baseName + '-' + packageName
  }
}
