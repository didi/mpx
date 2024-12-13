const compiler = require('../../lib/template-compiler/compiler')
const lib = require('../../lib/utils/normalize').lib
const getRulesRunner = require('../../lib/platform/index')

const errorFn = jest.fn(console.error)
const warnFn = jest.fn(console.warn)

function compileTemplate (template, { srcMode = 'wx', mode = 'ali', env = '' } = {}) {
  const parsed = compiler.parse(template, {
    usingComponents: [],
    usingComponentsInfo: {},
    externalClasses: [],
    srcMode,
    mode,
    env,
    warn: warnFn,
    error: errorFn,
    defs: {
      __mpx_mode__: mode,
      __mpx_src_mode__: srcMode,
      __mpx_env__: env
    },
    proxyComponentEventsRules: []
  })
  const ast = parsed.root
  return compiler.serialize(ast)
}

function compileJson (json, { srcMode = 'wx', mode = 'ali', type = 'app', globalComponents } = {}) {
  const rulesRunnerOptions = {
    mode,
    srcMode,
    type: 'json',
    waterfall: true,
    warn: warnFn,
    error: errorFn
  }
  if (type !== 'app') {
    rulesRunnerOptions.mainKey = type
    // polyfill global usingComponents
    rulesRunnerOptions.data = {
      globalComponents
    }
  }

  const rulesRunner = getRulesRunner(rulesRunnerOptions)
  if (rulesRunner) {
    rulesRunner(json)
  }
  return json
}

module.exports = {
  errorFn,
  warnFn,
  compileTemplate,
  compileJson,
  lib
}
