const registerFeatures = require('./genFeature')
const registerConfig = require('./genConfig')
const registerRoutes = require('./genRouter')
const registerDisplay = require('./genDisplay')
const util = require('./util')
const ConcatSource = require('webpack-sources').ConcatSource

module.exports = function (compilation, options, appJsonRules, isProd, hasTabBar) {
  let pagesMap = compilation.__mpx__.pagesMap || {}
  let projectEntry = compilation.__mpx__.projectEntry

  // @todo versionCode必填项，参考官网
  if (projectEntry) {
    // register basic info
    let basicInfo = `{
      "package": "${(options.packageInfo && options.packageInfo.name) || ''}",
      "name": "${(options.packageInfo && options.packageInfo.name) || ''}",
      "versionName": "${(options.packageInfo && options.packageInfo.version) || ''}",
      "versionCode": ${(options.packageInfo && options.packageInfo.version.slice(0, 3)) || 1.0},
      "minPlatformVersion": ${(options.quickapp && options.quickapp.minPlatformVersion) || 1070},  
      "icon": "../${options.iconPath || ''}",`

    let content = new ConcatSource(
      basicInfo
    )

    // register config info
    let defineConfig = (options.quickapp && options.quickapp.config) || {}
    if (!util.isObjectEmpty(defineConfig)) {
      let configInfo = `
      "config": ${registerConfig(defineConfig, appJsonRules, isProd)}`
      content.add(configInfo)
      content.add(`,`)
    }

    // register features
    let defineFeatures = (options.quickapp && options.quickapp.featuresInfo) || {}
    if (!util.isObjectEmpty(defineFeatures)) {
      let features = `
      "features": ${registerFeatures(defineFeatures)}`
      content.add(features)
    }

    // register router & subpackages
    let { routers, subpackages } = registerRoutes(projectEntry, pagesMap, options.quickapp.router, hasTabBar)
    content.add(`,
      "router": {${routers}
      }`
    )

    if (subpackages !== `[`) {
      subpackages += `
      ]`
      content.add(`,
      "subpackages": ${subpackages}`
      )
    }
    // register display
    let displayInfo = (options.quickapp && options.quickapp.display) || {}
    if (!util.isObjectEmpty(displayInfo)) {
      content.add(`,
      "display": ${registerDisplay(displayInfo, appJsonRules)}`
      )
    }

    // config trustedSslDomains
    let trustedSslDomains = (options.quickapp && options.quickapp.trustedSslDomains) || []
    if (trustedSslDomains.length > 0) {
      content.add(`,
      "trustedSslDomains": ${JSON.stringify(trustedSslDomains)}`
      )
    }
    content.add('\n}')
    compilation.assets['manifest.json'] = content
  }
}
