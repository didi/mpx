const compiler = require('./compiler')
const bindThis = require('./bind-this').transform
var input =
  '<wxs></wxs>' +
  '<view><com2 pro="{{ccc[122]}}">{{aaa}}</com2>' +
  '<view mode="__mpx_mode__">' +
  '{{__mpx_mode__ === "wx"}}' +
  '</view>' +
  'aaaa' +
  '<button open-type="getPhoneNumber" bindgetphonenumber="handlePhone">test</button></view>'

let parsed = compiler.parse(input, {
  usingComponents: ['com1', 'com2', 'com3'],
  compileBindEvent: true,
  mode: 'ali',
  srcMode: 'wx',
  isComponent: true
})
let ast = parsed.root

let meta = parsed.meta

console.log(compiler.serialize(ast))

let renderResult = bindThis(`global.currentInject = {
    render: function () {
      var __seen = [];
      var renderData = {};
      ${compiler.genNode(ast)}return renderData
    }
};\n`, {
  needCollect: true,
  ignoreMap: meta.wxsModuleMap
})

let globalInjectCode = renderResult.code + '\n'

if (renderResult.propKeys) {
  globalInjectCode += `global.currentInject.propKeys = ${JSON.stringify(renderResult.propKeys)};\n`
}

if (meta.computed) {
  globalInjectCode += bindThis(`global.currentInject.injectComputed = {
  ${meta.computed.join(',')}
  };`).code + '\n'
}

if (meta.refs) {
  globalInjectCode += `global.currentInject.getRefsData = function () {
  return ${JSON.stringify(meta.refs)};
  };\n`
}

console.log(globalInjectCode)
