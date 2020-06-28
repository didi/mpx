const ConcatSource = require('webpack-sources').ConcatSource

module.exports = function (compilation, finalFiles, options, isProd) {
  // @todo versionCode必填项，参考官网
  let basicInfo = `{\n
    "package": "${options.packageInfo.name}",\n
    "name": "${options.packageInfo.name}",\n
    "versionName": "${options.packageInfo.version}",\n
    "versionCode": "1",\n   
    "icon": "../${options.iconPath}",\n`

  let configInfo // @todo 对designWidth&&全局数据进行处理？
  if (isProd) {
    configInfo = `
      "config": {\n
        "designWidth": "750",\n
        "data": {}\n
      },\n`
  } else {
    configInfo = `
      "config": {\n
        "logLevel": "debug",\n
        "designWidth": "750",\n
        "data": {}\n
      },\n`
  }
  let content = new ConcatSource(
    basicInfo,
    configInfo
  )

  let index = compilation.__mpx__.projectEntry.indexOf('/')
  let entry = compilation.__mpx__.projectEntry.slice(0, index)
  let entryCompName = compilation.__mpx__.projectEntry.slice(index + 1)
  let routerPages = ''
  for (let j = 0; j < finalFiles.length; j++) {
    // let index, type, lastIndex, name, compPath
    let index, type, lastIndex, name
    if (finalFiles[j].indexOf('/')) {
      index = finalFiles[j].indexOf('/')
      type = finalFiles[j].slice(0, index)
      lastIndex = finalFiles[j].lastIndexOf('/')
      name = finalFiles[j].slice(lastIndex + 1)
      // compPath = finalFiles[j].slice(index + 1)
    }
    if (type === 'pages') {
      if (name !== entryCompName) {
        routerPages += `,\n
          "${name}": {\n}
          "component": "${finalFiles[j].slice(index + 1)}"\n
          }`
      } else {
        routerPages += `\n
          "entry": "${entry}",\n
          "pages": {\n
          "${entry}": {\n
            "component": "${entryCompName}"\n
          }\n`
      }
    } /* else if (type === 'components') {   // todo for widgets
      if (routerWidgets.length !== 0) {
        routerWidgets += ',\n'
      }
      routerWidgets += `"widgets": {\n
        "${type}": {\n
        "name": "${compPath}",\n
        "description": "",\n
        "component": "${finalFiles[j].slice(index + 1)}",\n
        "path": "${finalFiles[j]}",\n
        "features": "[]"
        }\n`
    } */
  }
  let routerPrefix = `"router": {\n`
  let tailBracket = `\n}`
  /* routerConcatStr = `\n},\n`,
    routerWidgets = `` */
  content.add(routerPrefix)
  content.add(routerPages)
  /* if (routerWidgets.length !== 0) {
    content.add(routerConcatStr)
    content.add(routerWidgets)
  } else {
    content.add('\n')
  } */
  content.add(tailBracket)
  content.add(tailBracket)
  content.add('\n}')
  compilation.assets['manifest.json'] = content
}
