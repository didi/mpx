const path = require('path')

// 将JS生成JSON
function compileMPXJSON ({ source, mode, filePath }) {
  // eslint-disable-next-line no-new-func
  const func = new Function('exports', 'require', 'module', '__filename', '__dirname', '__mpx_mode__', source)
  // 模拟commonJS执行
  // support exports
  const e = {}
  const m = {
    exports: e
  }
  const dirname = path.dirname(filePath)
  func(e, function (modulePath) {
    if (!path.isAbsolute(modulePath)) {
      if (modulePath.indexOf('.') === 0) {
        modulePath = path.resolve(dirname, modulePath)
      }
    }
    return require(modulePath)
  }, m, filePath, dirname, mode)
  // mpx-json借了nodejs的require实现，会有缓存，而外面引用这个json的时候对usingComponents做了side effect，从而导致在watch时会多了一些不存在的组件路径，从而resolve错误
  // 这里做了一个深复制绕过这个问题
  return JSON.parse(JSON.stringify(m.exports))
}

function compileMPXJSONText (opts) {
  return JSON.stringify(compileMPXJSON(opts), null, 2)
}

module.exports = {
  compileMPXJSON,
  compileMPXJSONText
}
