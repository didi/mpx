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

console.log(compiler.serialize(ast))

let renderResult = bindThis(`global.currentInject = {
    render: function () {
      ${compiler.genNode(ast)}
    }
};\n`, {
  needTravel: false,
  needKeyPath: true,
  ignoreMap: meta.wxsModuleMap
})

let globalInjectCode = renderResult.code + '\n'

if (renderResult.keyPathArr.length) {
  let renderData = `{${renderResult.keyPathArr.map((keyPath) => {
    return `${JSON.stringify(keyPath)}: this.${keyPath}`
  }).join(', ')}}`
  globalInjectCode += `global.currentInject.getRenderData = function () { 
  return ${renderData}; 
};\n`
}

if (meta.computed) {
  globalInjectCode += bindThis(`global.currentInject.injectComputed = {
  ${meta.computed.join(',')}
  };`).code + '\n'
}

console.log(globalInjectCode)
