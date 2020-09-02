
const ConcatSource = require('webpack-sources').ConcatSource
const genManifest = require('./genManifest')
const util = require('./util')

module.exports = function (additionalAssets, compilation, options, isProd) {
  let pagesList = util.isObjectEmpty(compilation.__mpx__.pagesMap) ? [] : Object.values(compilation.__mpx__.pagesMap)
  let componentsList = util.isObjectEmpty(compilation.__mpx__.componentsMap.main) ? [] : Object.values(compilation.__mpx__.componentsMap.main)
  // 整合pages & components & app
  let list = pagesList.concat(componentsList).concat(['app'])

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

  genManifest(compilation, options, isProd)
}
