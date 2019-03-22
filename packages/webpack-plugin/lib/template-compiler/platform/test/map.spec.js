const compiler = require('../../compiler')
// const bindThis = require('./bind-this').transform
var input = '<map enable-3D="true" binderror="handleError" bindregionchange="handleReg" show-compass="true"></map>'

let parsed = compiler.parse(input, {
  usingComponents: ['com1', 'com2', 'com3'],
  compileBindEvent: true,
  srcMode: 'wx',
  mode: 'ali'
})
let ast = parsed.root
console.log(compiler.serialize(ast))
