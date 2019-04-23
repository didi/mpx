const compiler = require('./compiler')
const bindThis = require('./bind-this').transform
var input =
  '<view>{{aaaaaa.bbb}}<view wx:for="{{aaa}}">' +
  '<view wx:for="{{bbb}}" wx:for-item="item2">' +
  '<view>{{item.aaa}}</view>' +
  '<view>{{item2.bbb}}</view>' +
  '</view>' +
  '</view></view>'

let parsed = compiler.parse(input, {
  usingComponents: ['com1', 'com2', 'com3'],
  compileBindEvent: true,
  mode: 'ali',
  srcMode: 'wx',
  isComponent: true
})
let ast = parsed.root
let meta = parsed.meta

let renderResult = bindThis(`global.currentInject = {
    render: function () {
      var __seen = [];
      var renderData = {};
      ${compiler.genNode(ast)}
      return renderData
    }
};\n`, {
  needCollect: true,
  ignoreMap: meta.wxsModuleMap
})

console.log(renderResult)
//
// let globalInjectCode = renderResult.code + '\n'
//
// if (meta.computed) {
//   globalInjectCode += bindThis(`global.currentInject.injectComputed = {
//   ${meta.computed.join(',')}
//   };`).code + '\n'
// }
//
// console.log(globalInjectCode)
