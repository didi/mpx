const fs = require('fs')
const path = require('path')
const repo = '/Users/hjw/project/mpx'
const parse = require(path.join(repo, 'packages/webpack-plugin/lib/parser'))
const babel = require(path.join(repo, 'node_modules/@babel/core'))
const postcss = require(path.join(repo, 'node_modules/postcss'))
const root = process.argv[2]
const results = []
const inspect = dir => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) return inspect(file)
    if (!/\.(mpx|json|js)$/.test(file)) return
    try {
      if (file.endsWith('.mpx')) {
        const sfc = parse(fs.readFileSync(file, 'utf8'), {filePath: file, mode: 'wx'})
        if (!sfc.template.content.trim()) throw new Error('missing template')
        babel.parseSync(sfc.script.content, {configFile: false, babelrc: false, sourceType: 'module'})
        if (sfc.json.content.trim()) JSON.parse(sfc.json.content)
        sfc.styles.forEach(style => postcss.parse(style.content))
      } else if (file.endsWith('.json')) JSON.parse(fs.readFileSync(file, 'utf8'))
      else babel.parseSync(fs.readFileSync(file, 'utf8'), {configFile: false, babelrc: false, sourceType: 'module'})
      results.push({file: path.relative(root, file), passed: true})
    } catch (error) { results.push({file: path.relative(root, file), passed: false, error: error.message}) }
  })
}
inspect(root)
console.log(JSON.stringify({scope: 'SFC extraction, script/JSON/CSS parsing only; not WeChat compilation', results}, null, 2))
if (results.some(r => !r.passed)) process.exitCode = 1
