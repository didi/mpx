const fs = require('fs')
const path = require('path')
const compiler = require(path.join(process.cwd(), 'packages/webpack-plugin/lib/template-compiler/compiler'))
const input = fs.readFileSync(path.join(__dirname, '../outputs/orders.mpx'), 'utf8')
const errors = []
const options = { mode: 'wx', srcMode: 'wx', filePath: 'orders.mpx', warn: m => console.log('WARN', m), error: m => errors.push(m) }
const component = compiler.parseComponent(input, options)
const result = compiler.parse(component.template.content, options)
const output = compiler.serialize(result.root)
fs.writeFileSync(path.join(__dirname, 'orders.wxml'), output)
if (errors.length) throw new Error(errors.join('\n'))
console.log('Mpx wx template parse/serialize succeeded, bytes:', output.length)
console.log('This is template compilation only, not a complete webpack or glass-easel build.')
