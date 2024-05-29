const { createSetupTemplate } = require('@mpxjs/template-engine')

module.exports = function (packageName) {
  const basePath = packageName === 'main' ? '' : `/${packageName}`
  return `<import src="${basePath}/mpx-custom-element-${packageName}"/>${createSetupTemplate()}`
}
