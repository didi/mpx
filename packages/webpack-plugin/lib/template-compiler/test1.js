const compiler = require('./compiler')
const bindThis = require('./bind-this').transform
var input =
  '<view wx:if="{{bb}}">aaa</view>' +
  '<view wx:elif="{{aaa}}">bbb</view>' +
  '<view wx:elif="{{true}}">ccc</view>' +
  '<view wx:else>ddd</view>'

let parsed = compiler.parse(input, {
  usingComponents: ['com1', 'com2', 'com3'],
  compileBindEvent: true,
  mode: 'ali',
  srcMode: 'wx',
  isComponent: false
})
let ast = parsed.root

let meta = parsed.meta

console.log(compiler.serialize(ast))

console.log(compiler.genNode(ast))

// let renderResult = bindThis(`global.currentInject = {
//     render: function () {
//       var __seen = [];
//       var renderData = {};
//       ${compiler.genNode(ast)}return renderData
//     }
// };\n`, {
//   needCollect: true,
//   ignoreMap: meta.wxsModuleMap
// })
//
// let globalInjectCode = renderResult.code + '\n'
//
// if (renderResult.propKeys) {
//   globalInjectCode += `global.currentInject.propKeys = ${JSON.stringify(renderResult.propKeys)};\n`
// }
//
// if (meta.computed) {
//   globalInjectCode += bindThis(`global.currentInject.injectComputed = {
//   ${meta.computed.join(',')}
//   };`).code + '\n'
// }
//
// if (meta.refs) {
//   globalInjectCode += `global.currentInject.getRefsData = function () {
//   return ${JSON.stringify(meta.refs)};
//   };\n`
// }
//
// console.log(globalInjectCode)
