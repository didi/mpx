
const ConcatSource = require('webpack-sources').ConcatSource

function genManefist (finalFiles, compilation) {
  let index = compilation.__mpx__.projectEntry.indexOf('\/'),
    entry = compilation.__mpx__.projectEntry.slice(0, index),
    entryCompName = compilation.__mpx__.projectEntry.slice(index + 1)
  let routerPrefix = `"router": {\n`,
    routerSuffix = `\n}`,
    routerConcatStr = `\n},\n`,
    routerPages = ``,
    routerWidgets = ``
  let content = new ConcatSource(
    '{\n',
    '"package": "test",\n',
    '"name": "demo0413",\n',
    '"versionName": "1.0.0",\n',
    '"versionCode": "1",\n',
    '"minPlatformVersion": "101",\n',
    '"icon": "../assets/panda.JPG",\n',
    ' "config": {\n',
    '"logLevel": "debug"\n',
    '},\n'
  )
    
  for (let j = 0; j < finalFiles.length; j++ ) {
    let index, type, lastIndex, name, compPath
    if (finalFiles[j].indexOf('\/')) {
      index = finalFiles[j].indexOf('\/')
      type = finalFiles[j].slice(0, index)
      lastIndex = finalFiles[j].lastIndexOf('\/')
      name = finalFiles[j].slice(lastIndex + 1)
      compPath = finalFiles[j].slice(index + 1)
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
    } else if (type === 'components') {
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
    }
  }
  content.add(routerPrefix)
  content.add(routerPages)
  if (routerWidgets.length !== 0) {
    content.add(routerConcatStr)
    content.add(routerWidgets)
  } else {
    content.add('\n')
  }
  content.add(routerSuffix)
  content.add(routerSuffix)
  content.add('\n}')
  compilation.assets['manifest.json'] = content
}

function cleanAssets (assets) {
  // clean Assets
  let files = []
  for (let file in assets) {
    filename = /(.*)\..*/.exec(file)[1]
    if (!files.includes(filename)) {
      files.push(filename)
    }
  }
  return files
}

module.exports = function (additionalAssets, compilation) {
  let finalFiles = cleanAssets(additionalAssets)
  // integrate assets
  for (let i = 0; i < finalFiles.length; i++) {
    let content = new ConcatSource()
    let jsonFile = finalFiles[i] + '.json'
    if (additionalAssets[jsonFile]) {
      additionalAssets[jsonFile].forEach(item => {
        let json = JSON.parse(item).usingComponents
        if (json) {
          let keys = Object.keys(json)
          keys.forEach(key => {
          let tpl = `<import name=" + ${key} + " src=".. + ${json[key]} + "></import>\n`
            content.add(tpl)
          })
        }
      })
    }
    content.add('<template>\n')
    let tplFile = finalFiles[i] + '.wxml'
    if (additionalAssets[tplFile]) {
      additionalAssets[tplFile].forEach(item => {
        content.add(item, '\n')
      })
    }
    content.add('\n</template>\n\n')
    let styleFile = finalFiles[i] + '.wxss'
    if (additionalAssets[styleFile]) {
      content.add('<style>')
      additionalAssets[styleFile].forEach(item => {
        content.add(item)
      })
    }
    content.add('</style>\n\n')
    let index = finalFiles[i].lastIndexOf('\/')
    let scriptName = finalFiles[i].slice(index + 1)
    let scriptFile = scriptName + '.js'
    let scriptTpl = `<script src="./${scriptFile}"></script>`
    content.add(scriptTpl)
    compilation.assets[finalFiles[i] + '.ux'] = content
  }
  genManefist(finalFiles, compilation)
}
