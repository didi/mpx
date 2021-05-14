const compiler = require('../../lib/template-compiler/compiler')

const errorFn = jest.fn(console.error)
const warnFn = jest.fn(console.warn)

function compileAndParse (input, { srcMode, mode } = { srcMode: 'wx', mode: 'ali' }) {
  const parsed = compiler.parse(input, {
    usingComponents: [],
    externalClasses: [],
    srcMode,
    mode,
    warn: warnFn,
    error: errorFn,
    defs: {
      '__mpx_mode__': mode,
      '__mpx_src_mode__': srcMode
    }
  })
  const ast = parsed.root
  return compiler.serialize(ast)
}

module.exports = {
  errorFn,
  warnFn,
  compileAndParse
}
