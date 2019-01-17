const compiler = require('./compiler')
const bindThis = require('./bind-this').transform
var input = '<view wx:style="{{aa}}" wx:class="{{a}}">{{a.b.c["aaa"].e}}</view>' +
  '<view wx:for="{{list}}">{{item}}</view>' +
  '<view>{{a.prototypea}}</view>' +
  '<view>{{b.c.d}}</view>'

let parsed = compiler.parse(input, {
  usingComponents: ['com1', 'com2', 'com3'],
  compileBindEvent: true
})
let ast = parsed.root
let meta = parsed.meta

const temp = `global.currentInject = {
    render: function () {
      var __seen = [];
      var renderData = {};
      ${compiler.genNode(ast)}
      var renderDataFinalKey = this.__processKeyPathMap(renderData)
      for (var key in renderData) {
        if (renderDataFinalKey.indexOf(key) === -1) {
          delete renderData[key]
        }
      }
      return renderData;
    }
};\n`

console.log(temp)

const bindConfig = {
  needTravel: false,
  needCollect: true,
  ignoreMap: meta.wxsModuleMap
}

let renderResult = bindThis(temp, bindConfig)

let globalInjectCode = renderResult.code + '\n'

if (meta.computed) {
  globalInjectCode += bindThis(`global.currentInject.injectComputed = {
  ${meta.computed.join(',')}
  };`).code + '\n'
}

console.log(globalInjectCode)
