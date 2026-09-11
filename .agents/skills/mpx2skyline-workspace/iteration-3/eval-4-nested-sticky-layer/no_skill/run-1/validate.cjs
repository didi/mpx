const fs = require('fs')
const compiler = require('/Users/hjw/project/mpx/packages/webpack-plugin/lib/template-compiler/compiler')
const base = '/private/tmp/skyline-v3-baseline-20260911/eval-4-nested-sticky-layer/no_skill'
const source = fs.readFileSync(base + '/outputs/category-panel.mpx', 'utf8')
const sfc = compiler.parseComponent(source, { mode: 'wx' })
const errors = []
const warnings = []
compiler.parse(sfc.template.content, { mode: 'wx', srcMode: 'wx', error: e => errors.push(e), warn: w => warnings.push(w) })
JSON.parse(sfc.json.content)
fs.writeFileSync(base + '/run-1/component.js', sfc.script.content)
console.log(JSON.stringify({ templateErrors: errors, templateWarnings: warnings, jsonParse: 'pass' }, null, 2))
if (errors.length) process.exitCode = 1
