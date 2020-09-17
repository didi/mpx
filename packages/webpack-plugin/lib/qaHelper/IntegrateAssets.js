
const ConcatSource = require('webpack-sources').ConcatSource
const genManifest = require('./genManifest')
const util = require('./util')

module.exports = function (additionalAssets, compilation, options, isProd) {
  let appJsonRules = {}
  let pagesList = util.isObjectEmpty(compilation.__mpx__.pagesMap) ? [] : Object.values(compilation.__mpx__.pagesMap)
  let componentsList = []
  for (let compFolder in compilation.__mpx__.componentsMap) {
    if (!util.isObjectEmpty(compFolder)) {
      componentsList = Object.assign(componentsList, Object.values(compilation.__mpx__.componentsMap[compFolder]))
    }
  }
  // 整合pages & components & app
  let list = pagesList.concat(componentsList, 'app')

  const builtInComponentsMap = compilation.__mpx__.builtInComponentsMap
  const pagesMap = compilation.__mpx__.pagesMap
  const componentsMap = compilation.__mpx__.componentsMap.main
  const qaComponentMap = {}

  Object.keys(builtInComponentsMap).forEach(resourcePath => {
    if (pagesMap[resourcePath]) {
      qaComponentMap[pagesMap[resourcePath]] = builtInComponentsMap[resourcePath]
    }
    if (componentsMap[resourcePath]) {
      qaComponentMap[componentsMap[resourcePath]] = builtInComponentsMap[resourcePath]
    }
  })

  for (let i = 0; i < list.length; i++) {
    let content = new ConcatSource()
    let jsonFile = list[i] + '.json'

    if (additionalAssets[jsonFile]) {
      let depth = list[i].split('/').length
      let srcPrefix = ''
      for (let i = 1; i < depth; i++) {
        if (i === depth - 1) {
          srcPrefix += '..'
        } else {
          srcPrefix += '../'
        }
      }
      // process json rules
      if (jsonFile === 'app.json') {
        additionalAssets[jsonFile].forEach(item => {
          let json = JSON.parse(item)
          appJsonRules = Object.assign({}, json)
        })
      }

      additionalAssets[jsonFile].forEach(item => {
        let json = JSON.parse(item).usingComponents
        if (json) {
          let keys = Object.keys(json)
          keys.forEach(key => {
            let tpl = `<import name="${key}" src="${srcPrefix + json[key] + '.ux'}"></import>\n`
            content.add(tpl)
          })
        }
      })
    }

    if (qaComponentMap[list[i]]) {
      Object.keys(qaComponentMap[list[i]]).forEach(tag => {
        content.add(`<import name="${tag}" src="${qaComponentMap[list[i]][tag]}"></import>\n`)
      })
    }

    let tplFile = list[i] + '.wxml'
    if (additionalAssets[tplFile]) {
      content.add('<template>\n')
      additionalAssets[tplFile].forEach(item => {
        content.add(item, '\n')
      })
      content.add('\n</template>\n\n')
    }

    let styleFile = list[i] + '.wxss'
    if (additionalAssets[styleFile]) {
      content.add('<style>')
      additionalAssets[styleFile].forEach(item => {
        content.add(item)
      })
      content.add('</style>\n\n')
    }

    let fullPath = list[i] + '.js'
    if (compilation.assets[fullPath]) {
      let index = list[i].lastIndexOf('/')
      let scriptName = list[i].slice(index + 1)
      let scriptFile = scriptName + '.js'
      let scriptTpl = `<script src="./${scriptFile}"></script>`
      content.add(scriptTpl)
    }

    compilation.assets[list[i] + '.ux'] = content
  }

  genManifest(compilation, options, appJsonRules, isProd)
}
