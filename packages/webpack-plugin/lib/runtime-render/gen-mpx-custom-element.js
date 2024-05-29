const fs = require('fs')
const path = require('path')
const { createCustomElementTemplate } = require('@mpxjs/template-engine')

module.exports = function (packageName) {
  const filename = `mpx-custom-element-${packageName}`
  const filePath = path.resolve(__dirname, `${filename}.mpx`)
  const request = `${filePath}` + '?mpxCustomElement&isComponent'
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, createCustomElementTemplate())
  }
  return {
    request,
    outputPath: filename
  }
}
