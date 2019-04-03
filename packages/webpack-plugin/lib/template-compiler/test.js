const compiler = require('./compiler')
// const bindThis = require('./bind-this').transform
// var input = '<view bindtap="handler" transitionend="xxx">{{a.b.c["aaa"].e}}</view>'
var input =
  '<view><component wx:show="bbb" is="aaa"></component>' +
  '</view>'

let parsed = compiler.parse(input, {
  usingComponents: ['com1', 'com2', 'com3'],
  compileBindEvent: true,
  mode: 'wx',
  isComponent: true
})
let ast = parsed.root
// let meta = parsed.meta
console.log(compiler.serialize(ast))

// const temp = `global.currentInject = {
//     render: function () {
//       var __seen = [];
//       var renderData = {};
//       ${compiler.genNode(ast)}
//       var renderDataFinalKey = this.__processKeyPathMap(renderData)
//       for (var key in renderData) {
//         if (renderDataFinalKey.indexOf(key) === -1) {
//           delete renderData[key]
//         }
//       }
//       return renderData;
//     }
// };\n`

//
// const bindConfig = {
//   needCollect: true,
//   ignoreMap: meta.wxsModuleMap
// }
//
// let renderResult = bindThis(temp, bindConfig)
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
