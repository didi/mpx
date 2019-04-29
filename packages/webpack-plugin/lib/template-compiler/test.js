const compiler = require('./compiler')
// const bindThis = require('./bind-this').transform
var input =
  '<view><view mode="__mpx_mode__">' +
  '{{__mpx_mode__ === "wx"}}' +
  '</view>' +
  'aaaa' +
  '<button open-type="getPhoneNumber" bindgetphonenumber="handlePhone">test</button></view>'

let parsed = compiler.parse(input, {
  usingComponents: ['com1', 'com2', 'com3'],
  compileBindEvent: true,
  mode: 'swan',
  srcMode: 'wx',
  isComponent: true
})
let ast = parsed.root
// let meta = parsed.meta

console.log(compiler.serialize(ast))

// let renderResult = bindThis(`global.currentInject = {
//     render: function () {
//       var __seen = [];
//       var renderData = {};
//       ${compiler.genNode(ast)}
//       return renderData
//     }
// };\n`, {
//   needCollect: true,
//   ignoreMap: meta.wxsModuleMap
// })

// console.log(renderResult)
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
