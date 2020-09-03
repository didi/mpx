const fs = require('fs')
const ConcatSource = require('webpack-sources').ConcatSource
const parseComponent = require('../parser')

module.exports = function (tabBar, compilation, options) {
  if (tabBar) {    
    let content = new ConcatSource()
    tabBar.list.forEach((item) => {
      const name = item.pagePath.replace(/.\//g, '')
      const targetPath = '../' + item.pagePath.replace(/^(.\/)/, '')
      content.add(`<import src="${targetPath}" name="${name}"></import>\n`)
    })
    const filePath = __dirname + '/tabBar.ux'
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) console.log(err)
      try {
        const parts = parseComponent(data, filePath, false, options.mode, options.defs)
        content.add('<template>' + parts.template.content + '</template>\n')
        content.add('<style>' + parts.styles[0].content + '</style>\n')
        content.add('<script>' + parts.script.content + '</script>\n')

        compilation.assets['pages/tabBar/index' + '.ux'] = content

      } catch (err) {
        console.log(err)
      }
    })
  }
}