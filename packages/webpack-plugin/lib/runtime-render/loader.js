const parseRequest = require('../utils/parse-request')
const config = require('../config')
const injectComponentConfig = require('./inject-component-config')
const { unRecursiveTemplate } = require('./wx-template')

// 获取分包名，动态注入 template / style / json 配置
module.exports = function (rawContent) {
  this.cacheable(false)
  const callback = this.async()
  const mpx = this.getMpx()
  const { resourcePath, queryObj } = parseRequest(this.resource)
  const mode = mpx.mode
  const type = queryObj.type
  const moduleId = queryObj.moduleId
  const currentPackageRoot = queryObj.packageRoot || mpx.currentPackageRoot || 'main'
  const componentsMap = mpx.componentsMap[currentPackageRoot]
  const typeExtMap = config[mode].typeExtMap
  const file = componentsMap[resourcePath] + typeExtMap[type]

  if (!mpx) {
    return rawContent
  }

  let content = ''
  if (type === 'template') {
    injectComponentConfig[currentPackageRoot].internalComponents = injectComponentConfig.internalComponents
    content = '<template is=\"tmpl_0_container\" data=\"{{ i: r }}\"></template>\n' + unRecursiveTemplate.buildTemplate(injectComponentConfig[currentPackageRoot])
  } else if (type === 'styles') {
    content = mpx.runtimeRender.getPackageInjectedWxss(currentPackageRoot)
  } else if (type === 'json') {
    const jsonBlock = {
      component: true,
      usingComponents: mpx.runtimeRender.getPackageInjectedComponentsMap(currentPackageRoot)
    }
    content = JSON.stringify(jsonBlock, null, 2)
  }

  this.emitFile(file, '', undefined, {
    skipEmit: true,
    extractedInfo: {
      content,
      index: 0
    }
  })

  if (type === 'json' && mpx.moduleTemplate[moduleId]) {
    this.loadModule(mpx.moduleTemplate[moduleId].slice(1, -1), (err) => {
      if (err) return callback(err)
      callback(null, '')
    })
  } else {
    callback(null, '')
  }
}
