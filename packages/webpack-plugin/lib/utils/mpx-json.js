const path = require('path')

// 将JS生成JSON
function compileMPXJSON ({ source, defs, filePath }) {
  const defKeys = Object.keys(defs)
  const defValues = defKeys.map((key) => {
    return defs[key]
  })
  // eslint-disable-next-line no-new-func
  const func = new Function('exports', 'require', 'module', '__filename', '__dirname', ...defKeys, source)
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
  }, m, filePath, dirname, ...defValues)
  return m.exports
}

function compileMPXJSONText (opts) {
  return JSON.stringify(compileMPXJSON(opts), null, 2)
}

module.exports = {
  compileMPXJSONText
}
