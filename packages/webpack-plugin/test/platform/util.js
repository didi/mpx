const compiler = require('../../lib/template-compiler/compiler')
const lib = require('../../lib/utils/normalize').lib

const errorFn = jest.fn(console.error)
const warnFn = jest.fn(console.warn)

function compileAndParse (input, { srcMode, mode, env } = { srcMode: 'wx', mode: 'ali', env: '' }) {
  const parsed = compiler.parse(input, {
    usingComponents: [],
    externalClasses: [],
    srcMode,
    mode,
    env,
    warn: warnFn,
    error: errorFn,
    defs: {
      '__mpx_mode__': mode,
      '__mpx_src_mode__': srcMode,
      '__mpx_env__': env
    }
  })
  const ast = parsed.root
  return compiler.serialize(ast)
}

module.exports = {
  errorFn,
  warnFn,
  compileAndParse,
  lib
}
