const config = require('../config')
const { ConcatSource } = require('webpack').sources
const JavascriptModulesPlugin = require('webpack/lib/javascript/JavascriptModulesPlugin')
const RuntimeGlobals = require('webpack/lib/RuntimeGlobals')
const HelperRuntimeModule = require('webpack/lib/runtime/HelperRuntimeModule')
const Template = require('webpack/lib/Template')

class MakeNamespaceObjectRuntimeModule extends HelperRuntimeModule {
  constructor () {
    super('make namespace object')
  }

  generate () {
    const { runtimeTemplate } = this.compilation
    const fn = RuntimeGlobals.makeNamespaceObject
    return Template.asString([
      '// define __esModule on exports',
      `${fn} = ${runtimeTemplate.basicFunction('exports', [
        'exports.__esModule = true;'
      ])};`
    ])
  }
}

class CompatGetDefaultExportRuntimeModule extends HelperRuntimeModule {
  constructor () {
    super('compat get default export')
  }

  generate () {
    const { runtimeTemplate } = this.compilation
    const fn = RuntimeGlobals.compatGetDefaultExport
    return Template.asString([
      '// getDefaultExport function for compatibility with non-harmony modules',
      `${fn} = ${runtimeTemplate.basicFunction('module', [
        'var getter = module && module.__esModule ?',
        Template.indent([
          `${runtimeTemplate.returningFunction('module["default"]')} :`,
          `${runtimeTemplate.returningFunction('module')};`
        ]),
        'getter.a = getter();',
        'return getter;'
      ])};`
    ])
  }
}

module.exports = class WxsTemplatePlugin {
  constructor (options = { mode: 'wx' }) {
    this.options = options
  }

  apply (compilation) {
    const hooks = JavascriptModulesPlugin.getCompilationHooks(compilation)

    hooks.renderStartup.tap('WxsTemplatePlugin', (source) => {
      const postfix = 'return __webpack_exports__ && __webpack_exports__.__esModule? __webpack_exports__["default"] : __webpack_exports__;\n'
      return new ConcatSource(source, postfix)
    })

    hooks.render.tap('WxsTemplatePlugin', (source) => {
      const prefix = config[this.options.mode].wxs.templatePrefix
      return new ConcatSource(prefix, source)
    })

    // __webpack_require__.r
    compilation.hooks.runtimeRequirementInTree
      .for(RuntimeGlobals.makeNamespaceObject)
      .tap({
        name: 'WxsTemplatePlugin',
        stage: -1000
      }, chunk => {
        compilation.addRuntimeModule(
          chunk,
          new MakeNamespaceObjectRuntimeModule()
        )
        return true
      })

    // __webpack_require__.n
    compilation.hooks.runtimeRequirementInTree
      .for(RuntimeGlobals.compatGetDefaultExport)
      .tap({
        name: 'WxsTemplatePlugin',
        stage: -1000
      }, chunk => {
        compilation.addRuntimeModule(
          chunk,
          new CompatGetDefaultExportRuntimeModule()
        )
        return true
      })

    // mainTemplate.hooks.requireExtensions.tap(
    //   'WxsMainTemplatePlugin',
    //   () => {
    //     return Template.asString([
    //       '// define harmony function exports',
    //       `${mainTemplate.requireFn}.d = function(exports, name, getter) {`,
    //       Template.indent([
    //         'exports[name] = getter();'
    //       ]),
    //       '};',
    //       '',
    //       '// define __esModule on exports',
    //       `${mainTemplate.requireFn}.r = function(exports) {`,
    //       Template.indent([
    //         'exports.__esModule = true;'
    //       ]),
    //       '};',
    //       '',
    //       '// getDefaultExport function for compatibility with non-harmony modules',
    //       mainTemplate.requireFn + '.n = function(module) {',
    //       Template.indent([
    //         'var getter = module && module.__esModule ?',
    //         Template.indent([
    //           'function getDefault() { return module["default"]; } :',
    //           'function getModuleExports() { return module; };'
    //         ]),
    //         `getter.a = getter();`,
    //         'return getter;'
    //       ]),
    //       '};'
    //     ])
    //   }
    // )
  }
}
