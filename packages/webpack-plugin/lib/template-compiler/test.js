const compiler = require('./compiler')
const bindThis = require('./bind-this').transform
var input = '<view a:style="{{aa}}" a:class="{{a}}">{{a.b.c["aaa"].e}}</view>' +
  '<view a:for="{{list}}" a:if="{{a.b.c.list.length}}">{{item}}</view>' +
  '<view>{{a.prototypea}}</view>' +
  '<com1 a:if="{{aasda || aaasdsa}}asdasds{{aaa}}"></com1>' +
  '<com2 a:class="{{aasd}}" class="asdas" a:ref="com2" a:else></com2>'

let parsed = compiler.parse(input, {
  usingComponents: ['com1', 'com2', 'com3'],
  compileBindEvent: true,
  mode: 'ali'
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
