const compiler = require('../../lib/template-compiler/compiler')
const path = require('path')

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

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

function baseParse (template, { srcMode, mode, env } = { srcMode: 'wx', mode: 'wx', env: '' }) {
  return compiler.parse(template, {
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
}

module.exports = {
  errorFn,
  warnFn,
  compileAndParse,
  resolve,
  baseParse
}
