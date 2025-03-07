const RuntimeGlobals = require('webpack/lib/RuntimeGlobals')
const Template = require('webpack/lib/Template')
const HelperRuntimeModule = require('webpack/lib/runtime/HelperRuntimeModule')

class LoadAsyncChunkRuntimeModule extends HelperRuntimeModule {
  constructor (options = {}) {
    super('load async chunk')
    /**
     * loadAsyncChunk
     * timeout -> 支持配置
     * publicPath -> 看具体方案(以及是否要拆出来，避免和web的复用)
     * hash 场景（版本控制） -> webpack 来做还是 metro 来做 -> 本质还是做版本控制，看具体的方案
     * fallbackPage -> 传个组件路径？内置组件
     * loadedEvent 后续需要和 native 对接，事件对象的确认 (状态枚举：loaded/missing/failed/timeout)，
     */
    this.options = options
    this.loadAsyncFn = options.loadAsyncFn
    this.timeout = options.timeout || 5000
  }

  generate () {
    const { compilation } = this
    const { runtimeTemplate } = compilation
    const loadScriptFn = RuntimeGlobals.loadScript
    const loadAsyncFn = this.loadAsyncFn.toString()
    return Template.asString([
      'var inProgress = {};',
      `${loadScriptFn} = ${runtimeTemplate.basicFunction(
        'url, done, key, chunkId',
        [
          'if(inProgress[url]) { inProgress[url].push(done); return; }',
          'inProgress[url] = [done];',
          `var chunkName = ${RuntimeGlobals.getChunkScriptFilename}(chunkId)`,
          'var callback = function (type, result) {', // todo 确认下加载函数的回调值是否需要？
          "if (type === 'timeout' || type === 'fail') {",
          Template.indent([
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
          "var failedCallback = callback.bind(null, 'fail')", // import 没法加载远程 js 代码，本地调试只能静态路径；
          `var loadFn = ${loadAsyncFn}`,
          'loadFn(url, successCallback, failedCallback)'
        ]
      )}`
    ])
  }
}

module.exports = LoadAsyncChunkRuntimeModule
