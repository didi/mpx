const RuntimeGlobals = require('webpack/lib/RuntimeGlobals')
const Template = require('webpack/lib/Template')
const HelperRuntimeModule = require('webpack/lib/runtime/HelperRuntimeModule')

class LoadAsyncChunkRuntimeModule extends HelperRuntimeModule {
  constructor (timeout) {
    super('load async chunk')
    this.timeout = timeout || 5000
  }

  generate () {
    const { compilation } = this
    const { runtimeTemplate } = compilation
    const loadScriptFn = RuntimeGlobals.loadScript
    return Template.asString([
      'var inProgress = {};',
      `${loadScriptFn} = ${runtimeTemplate.basicFunction(
        'url, done, key, chunkId',
        [
          `var packageName = ${RuntimeGlobals.getChunkScriptFilename}(chunkId) || ''`,
          'packageName = packageName.split("/")[0]',
          'var config = {',
          Template.indent([
            'url: url,',
            'package: packageName'
          ]),
          '}',
          'if(inProgress[url]) { inProgress[url].push(done); return; }',
          'inProgress[url] = [done];',
          'var callback = function (type, result) {',
          Template.indent([
            'var event = {',
            Template.indent([
              'type: type,',
              'target: {',
              Template.indent(['src: url']),
              '}'
            ]),
            '}'
          ]),
          Template.indent([
            'var doneFns = inProgress[url]',
            'clearTimeout(timeoutCallback)',
            'delete inProgress[url]',
            `doneFns && doneFns.forEach(${runtimeTemplate.returningFunction(
              'fn(event)',
              'fn'
            )})`
          ]),
          '}',
          `var timeoutCallback = setTimeout(callback.bind(null, 'timeout'), ${this.timeout})`,
          "var successCallback = callback.bind(null, 'fail');", // 错误类型和 wx 对齐
          "var failedCallback = callback.bind(null, 'fail')",
          'var loadChunkAsyncFn = global.__mpx.config.rnConfig && global.__mpx.config.rnConfig.loadChunkAsync',
          'if (typeof loadChunkAsyncFn !== \'function\') {',
            Template.indent([
              'console.error("[Mpx runtime error]: please provide correct loadChunkAsync function")',
              'return'
            ]),
          '}',
          'loadChunkAsyncFn(config).then(successCallback).catch(failedCallback)'
        ]
      )}`
    ])
  }
}

module.exports = LoadAsyncChunkRuntimeModule
