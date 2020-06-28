
const ConcatSource = require('webpack-sources').ConcatSource
const genManifest = require('./genManifest')

function cleanAssets (assets) {
  // clean Assets
  let files = []
  for (let file in assets) {
    let filename = /(.*)\..*/.exec(file)[1]
    if (!files.includes(filename)) {
      files.push(filename)
    }
  }
  return files
}

module.exports = function (additionalAssets, compilation, options, isProd) {
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
            let tpl = `<import name="${key}" src="..${json[key] + '.ux'}"></import>\n`
            content.add(tpl)
          })
        }
      })
    }

    let tplFile = finalFiles[i] + '.wxml'
    if (additionalAssets[tplFile]) {
      content.add('<template>\n')
      additionalAssets[tplFile].forEach(item => {
        content.add(item, '\n')
      })
      content.add('\n</template>\n\n')
    }

    let styleFile = finalFiles[i] + '.wxss'
    if (additionalAssets[styleFile]) {
      content.add('<style>')
      additionalAssets[styleFile].forEach(item => {
        content.add(item)
      })
      content.add('</style>\n\n')
    }

    let fullPath = finalFiles[i] + '.js'
    if (compilation.assets[fullPath]) {
      let index = finalFiles[i].lastIndexOf('/')
      let scriptName = finalFiles[i].slice(index + 1)
      let scriptFile = scriptName + '.js'
      let scriptTpl = `<script src="./${scriptFile}"></script>`
      content.add(scriptTpl)
    }

    compilation.assets[finalFiles[i] + '.ux'] = content
  }

  genManifest(compilation, finalFiles, options, isProd)
}
