const RuntimeGlobals = require('webpack/lib/RuntimeGlobals')
const Template = require('webpack/lib/Template')
const HelperRuntimeModule = require('webpack/lib/runtime/HelperRuntimeModule')

class LoadAsyncChunkRuntimeModule extends HelperRuntimeModule {
  constructor () {
    super('load async chunk')
  }

  generate () {
    const { compilation } = this
    const { runtimeTemplate } = compilation
    const loadScriptFn = RuntimeGlobals.loadScript
    return Template.asString([
      'var inProgress = {}',
      `${loadScriptFn} = ${runtimeTemplate.basicFunction(
        'url, done, key, chunkId',
        [
          `var packageName = ${RuntimeGlobals.getChunkScriptFilename}(chunkId) || ''`,
          'packageName = packageName.split(\'/\').slice(0, -1).join(\'/\')',
          'var config = {',
          Template.indent([
            'url: url,',
            'package: packageName'
          ]),
          '}',
          'if(inProgress[url]) {',
          Template.indent([
            'inProgress[url].push(done)',
            'return'
          ]),
          '}',
          'inProgress[url] = [done]',
          'var callback = function (type) {',
          Template.indent([
            'var event = {',
            Template.indent([
              'type: type || \'fail\',',
              'target: {',
              Template.indent(['src: url']),
              '}'
            ]),
            '}'
          ]),
          Template.indent([
            'var doneFns = inProgress[url]',
            'delete inProgress[url]',
            `doneFns && doneFns.forEach(${runtimeTemplate.returningFunction(
              'fn(event)',
              'fn'
            )})`
          ]),
          '}',
          'var loadChunkAsyncFn = global.__mpx.config.rnConfig && global.__mpx.config.rnConfig.loadChunkAsync',
          'try {',
          Template.indent([
            'loadChunkAsyncFn(config).then(callback).catch(callback)'
          ]),
          '} catch (e) {',
          Template.indent([
            'console.error(\'[Mpx runtime error]: please provide correct mpx.config.rnConfig.loadChunkAsync implemention!\', e)',
            'Promise.resolve().then(callback)'
          ]),
          '}'
        ]
      )}`
    ])
  }
}

module.exports = LoadAsyncChunkRuntimeModule
