// 将JS生成JSON
function compileMPXJSON ({ source, mode }) {
  // eslint-disable-next-line no-new-func
  const func = new Function('exports', 'require', 'module', '__mpx_mode__', source)
  // 模拟commonJS执行
  // support exports
  const e = {}
  const m = {
    exports: e
  }
  func(e, require, m, mode)
  return m.exports
}

function compileMPXJSONText (opts) {
  return JSON.stringify(compileMPXJSON(opts), null, 2)
}

module.exports = {
  compileMPXJSON,
  compileMPXJSONText
}
