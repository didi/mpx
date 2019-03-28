const compiler = require('./compiler')
// const bindThis = require('./bind-this').transform
// var input = '<view bindtap="handler" transitionend="xxx">{{a.b.c["aaa"].e}}</view>'
var input = `<swiper wx:if="aaa" bindchange="handler">{{a.b.c["aaa"].e}}</swiper>
<view bindtransitionend></view>
<scroll-view  bindscrolltoupper="dd"></scroll-view>
<movable-view></movable-view>
<movable-area></movable-area>
<button bindlaunchapp></button>
<form bindsubmit></form>
<input cursor-spacing></input>
<slider selected-color color bindchange block-color></slider>
<map bindmarkertap></map>
<cover-image bindload aria-role></cover-image>`

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
