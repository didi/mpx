const registerFeatures = require('./genFeature')
const registerConfig = require('./genConfig')
const registerRoutes = require('./genRouter')
const registerDisplay = require('./genDisplay')
const util = require('./util')
const ConcatSource = require('webpack-sources').ConcatSource

module.exports = function (compilation, options, isProd) {
  let pagesMapArray = compilation.__mpx__.pagesMap && Object.values(compilation.__mpx__.pagesMap)
  let projectEntry = compilation.__mpx__.projectEntry

  // @todo versionCode必填项，参考官网
  if (projectEntry) {
    // register basic info
    let basicInfo = `{
      "package": "${options.packageInfo.name}",
      "name": "${options.packageInfo.name}",
      "versionName": "${options.packageInfo.version}",
      "versionCode": "1",
      "minPlatformVersion": "1040",  
      "icon": "../${options.iconPath}",`

    let content = new ConcatSource(
        basicInfo
      )

    // register config info
    let configInfo = `
      "config": ${registerConfig()}`
    content.add(configInfo)
    content.add(`,`)

    // register features
    let features = `
      "features": ${registerFeatures()}`
    content.add(features)
    content.add(`,`)

    // register router & subpackages
    let { routers, subpackages} = registerRoutes(projectEntry,pagesMapArray)
    let routes = `
      "router": {${routers}
      }`
    content.add(routes)

    if (subpackages !== `[`) {
      subpackages += `
      ]`
      let sub = `"subpackages": ${subpackages}`
      content.add(
        `,
        ${sub}`
      )
    }
    // register display
    if (!util.isObjectEmpty()) {
      content.add(`,\n`)
      let display = `
        "display": {${registerDisplay()}
      }`
    }
    content.add('\n}')
    compilation.assets['manifest.json'] = content
  }
}
