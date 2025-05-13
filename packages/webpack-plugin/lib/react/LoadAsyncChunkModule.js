const RuntimeGlobals = require('webpack/lib/RuntimeGlobals')
const Template = require('webpack/lib/Template')
const HelperRuntimeModule = require('webpack/lib/runtime/HelperRuntimeModule')

class LoadAsyncChunkRuntimeModule extends HelperRuntimeModule {
  constructor (options = {}) {
    super('load async chunk')
    /**
     * timeout
     * loadedEvent 后续需要和 native 对接，事件对象的确认 (状态枚举：loaded/missing/failed/timeout)，
     */
    this.options = options
    this.loadAsyncTemplate = options.loadAsyncTemplate // todo clear
    this.timeout = options.timeout || 5000
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
          // todo dev 环境下的测试
          `var chunkName = ${RuntimeGlobals.getChunkScriptFilename}(chunkId) || ''`,
          'var config = {',
          Template.indent([
            'url: url,',
            "chunkName: chunkName.split('/')[0]"
          ]),
          '}',
          'if(inProgress[url]) { inProgress[url].push(done); return; }',
          'inProgress[url] = [done];',
          'var callback = function (type, result) {', // todo 确认下加载函数的回调值是否需要？
          Template.indent([
            "if (type === 'timeout' || type === 'fail') {",
            'var lazyLoadEvent = {',
            Template.indent([
              "type: 'subpackage',",
              'subpackage: [chunkName],',
              'errMsg: "loadSubpackage: " + type'
            ]),
            '}',
            'global.onLazyLoadError(lazyLoadEvent)'
          ]),
          '}',
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
          "var successCallback = callback.bind(null, 'load');",
          "var failedCallback = callback.bind(null, 'fail')",
          'var loadChunkAsyncFn = global.__mpx.config.rnConfig && global.__mpx.config.rnConfig.loadChunkAsync',
          // `var loadChunkAsyncFn = ${this.loadAsyncTemplate.trim()}`,
          'loadChunkAsyncFn(config).then(successCallback).catch(failedCallback)'
        ]
      )}`
    ])
  }
}

module.exports = LoadAsyncChunkRuntimeModule
