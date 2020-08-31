const registerFeatures = require('./genFeature')
const registerConfig = require('./genConfig')
const registerRoutes = require('./genRouter')
const ConcatSource = require('webpack-sources').ConcatSource

module.exports = function (compilation, options, isProd) {
  let pagesMapArray = compilation.__mpx__.pagesMap && Object.values(compilation.__mpx__.pagesMap)
  let projectEntry = compilation.__mpx__.projectEntry

  // @todo versionCode必填项，参考官网
  if (projectEntry) {
    // basic info
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

    // config info
    let configInfo = `
      "config": ${registerConfig()}`
    content.add(configInfo)
    content.add(`,`)

    // features info
    let features = `
      "features": ${registerFeatures()}`
    content.add(features)
    content.add(`,`)

    // config router & subpackages
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
  content.add('\n}')
  compilation.assets['manifest.json'] = content
  }
}
