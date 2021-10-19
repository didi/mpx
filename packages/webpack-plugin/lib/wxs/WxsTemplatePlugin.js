const Template = require('webpack/lib/Template')
const config = require('../config')
const { ConcatSource } = require('webpack').sources
const JavascriptModulesPlugin = require('webpack/lib/javascript/JavascriptModulesPlugin')

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

    // todo webpack5的新的代码生成模式下完美支持.d.r.n的成本较高，暂不处理，wxs暂时只支持wx源码形式
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
