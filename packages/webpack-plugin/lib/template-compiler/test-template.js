const compiler = require('./compiler')
// const bindThis = require('./bind-this').transform
var input =
  '<view>{{aaaaaa.bbb}}<view wx:for="{{aaa}}">' +
  '<slider bindchange bindchanging>{{aaaaaa.bbb}}</slider wx:for="{{aaa}}">' +
  '<map subkey></map>' +
  '<functional-page-navigator></functional-page-navigator>' +
  '<navigator open-type="aaa" bindchanging>{{aaaaaa.bbb}}</navigator wx:for="{{aaa}}">' +
  '<button open-type="aaa" lang>{{aaaaaa.bbb}}</button>' +
  '<view wx:for="{{bbb}}" wx:for-item="item2">' +
  '<view>{{item.aaa}}</view>' +
  '<view>{{item2.bbb}}</view>' +
  '</view>' +
  '</view></view>'

let parsed = compiler.parse(input, {
  usingComponents: ['com1', 'com2', 'com3'],
  compileBindEvent: true,
  srcMode: 'wx',
  mode: 'swan'
})
let ast = parsed.root
console.log(compiler.serialize(ast))
