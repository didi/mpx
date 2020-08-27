const registerFeatures = require('./genFeature')
const ConcatSource = require('webpack-sources').ConcatSource

module.exports = function (compilation, options, isProd) {
  let pagesMapArray = compilation.__mpx__.pagesMap && Object.values(compilation.__mpx__.pagesMap)
  let projectEntry = compilation.__mpx__.projectEntry

  // @todo versionCode必填项，参考官网
  if (projectEntry) {
    let basicInfo = `{
      "package": "${options.packageInfo.name}",
      "name": "${options.packageInfo.name}",
      "versionName": "${options.packageInfo.version}",
      "versionCode": "1",
      "minPlatformVersion": "1040",  
      "icon": "../${options.iconPath}",`

    let configInfo // @todo 对designWidth&&全局数据进行处理？
    if (isProd) {
      configInfo = `
      "config": {
        "designWidth": "750",
        "data": {}
      },`
    } else {
      configInfo = `
      "config": {
        "logLevel": "debug",
        "designWidth": "750",
        "data": {}
      },`
    }
    let content = new ConcatSource(
      basicInfo,
      configInfo
    )
    let features = `
      "features": ${registerFeatures()}`
    content.add(features)
    content.add(`,`)
    // concat router
    let routerPrefix = `
      "router": {`
    content.add(routerPrefix)

    let routerPages = ``
    let lastIndex = projectEntry.lastIndexOf('/')
    let entryComp = projectEntry.slice(lastIndex + 1)
    let prefix = projectEntry.slice(0, lastIndex)

    routerPages += `
        "entry": "${prefix}",
        "pages": {
          "${prefix}": {
            "component": "${entryComp}"
          }`

    let subpackageConfig = `[`
    for (let i = 0; i < pagesMapArray.length; i++) {
      if (pagesMapArray[i] !== projectEntry) {
        let lastIndex = pagesMapArray[i].lastIndexOf('/')
        let compName = pagesMapArray[i].slice(lastIndex + 1)
        let prefix = pagesMapArray[i].slice(0, lastIndex)

        routerPages += `,
          "${prefix}": {
            "component": "${compName}"
          }`
      }
      let isSubpackage = pagesMapArray[i].split('/')[0] !== 'pages'
      if (isSubpackage) {
        let name = pagesMapArray[i].split('/')[0]
        if (subpackageConfig !== `[`) {
          subpackageConfig += `,
          {
            "name": "${name}",
            "resource": "${name}"
          }`
        } else {
          subpackageConfig += `
          {
            "name": "${name}",
            "resource": "${name}"
          }`
        }
      }
    }
    content.add(routerPages)
    content.add(
      `
        }`
    )
    content.add(
      `       
      }`
    )
    if (subpackageConfig !== `[`) {
      subpackageConfig += `
      ]`
      let sub = `"subpackages": ${subpackageConfig}`
      content.add(
        `,
      ${sub}`
      )
    }
    content.add('\n}')
    compilation.assets['manifest.json'] = content
  }
}
