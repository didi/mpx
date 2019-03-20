const compiler = require('./compiler')
// const bindThis = require('./bind-this').transform
var input = '<view  wx:style="{{aa}}" wx:class="{{a}}">{{a.b.c["aaa"].e}}</view>' +
  '<view aria-role="button" bindanimationstart="handler"  wx:for="{{list}}" wx:if="{{a.b.c.list.length}}">{{item}}</view>' +
  '<view>{{a.prototypea}}</view>' +
  '<com1 wx:if="{{aasda || aaasdsa}}asdasds{{aaa}}"></com1>' +
  '<com2 wx:class="{{aasd}}" class="asdas" wx:ref="com2" wx:else></com2>'

let parsed = compiler.parse(input, {
  usingComponents: ['com1', 'com2', 'com3'],
  compileBindEvent: true,
  srcMode: 'wx',
  mode: 'ali'
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
