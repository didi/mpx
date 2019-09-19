const path = require('path')

let _mpx

function setMpx (mpx) {
  _mpx = mpx
}

// 将JS生成JSON
// TODO webpack alias support
function compileMPXJSON ({ source, mode, filePath }) {
  const contentReplacer = _mpx.contentReplacer
  source = contentReplacer.replace({
    resourcePath: filePath,
    content: source
  }).content
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
  return m.exports
}

function compileMPXJSONText (opts) {
  return JSON.stringify(compileMPXJSON(opts), null, 2)
}

module.exports = {
  compileMPXJSON,
  compileMPXJSONText,
  setMpx
}
