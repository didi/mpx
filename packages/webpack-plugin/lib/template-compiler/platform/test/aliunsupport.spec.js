const compiler = require('../../compiler')
var input = `
<live-pusher></live-pusher>
<view bindtap="handle">111</view>
`

let parsed = compiler.parse(input, {
  usingComponents: ['com1', 'com2', 'com3'],
  compileBindEvent: true,
  srcMode: 'wx',
  mode: 'ali'
})
let ast = parsed.root
console.log(compiler.serialize(ast))
