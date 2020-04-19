const Template = require('webpack/lib/Template')
const config = require('../config')
const { ConcatSource } = require('webpack-sources')

module.exports = class WxsMainTemplatePlugin {
  constructor (options = { mode: 'wx' }) {
    this.options = options
  }

  apply (mainTemplate, compilation) {
    mainTemplate.hooks.require.tap('MainTemplate', (source, chunk, hash) => {
      return Template.asString([
        '// Check if module is in cache',
        'if(installedModules[moduleId]) {',
        Template.indent('return installedModules[moduleId].exports;'),
        '}',
        '// Create a new module (and put it into the cache)',
        'var module = installedModules[moduleId] = {',
        Template.indent(mainTemplate.hooks.moduleObj.call('', chunk, hash, 'moduleId')),
        '};',
        '',
        Template.asString(
          [
            '// Execute the module function',
            '// wxs连call都不支持我也是服气...',
            `modules[moduleId](module, module.exports, ${mainTemplate.renderRequireFunctionForModule(
              hash,
              chunk,
              'moduleId'
            )});`
          ]
        ),
        '',
        '// Flag the module as loaded',
        'module.l = true;',
        '',
        '// Return the exports of the module',
        'return module.exports;'
      ])
    })
    mainTemplate.hooks.requireExtensions.tap(
      'WxsMainTemplatePlugin',
      () => {
        return Template.asString([
          '// define harmony function exports',
          `${mainTemplate.requireFn}.d = function(exports, name, getter) {`,
          Template.indent([
            'exports[name] = getter();'
          ]),
          '};',
          '',
          '// define __esModule on exports',
          `${mainTemplate.requireFn}.r = function(exports) {`,
          Template.indent([
            'exports.__esModule = true;'
          ]),
          '};',
          '',
          '// getDefaultExport function for compatibility with non-harmony modules',
          mainTemplate.requireFn + '.n = function(module) {',
          Template.indent([
            'var getter = module && module.__esModule ?',
            Template.indent([
              'function getDefault() { return module["default"]; } :',
              'function getModuleExports() { return module; };'
            ]),
            `getter.a = getter();`,
            'return getter;'
          ]),
          '};'
        ])
      }
    )
    mainTemplate.hooks.renderWithEntry.tap(
      'WxsMainTemplatePlugin',
      (source, chunk, hash) => {
        if (this.options.mode === 'swan') {
          if (compilation.__swan_exports_map__) {
            const prefix = config[this.options.mode].wxs.templatePrefix
            const exportsItems = []
            for (let key in compilation.__swan_exports_map__) {
              if (compilation.__swan_exports_map__.hasOwnProperty(key)) {
                exportsItems.push([
                  `${key}: function(){`,
                  Template.indent([
                    'var args = Array.prototype.slice.call(arguments, 1);',
                    `return __swan_exports__.${key}.apply(this, args);`
                  ]),
                  '},'
                ])
              }
            }

            if (exportsItems.length === 0) {
              throw new Error('Swan filter module must has an ExportDefaultDeclaration!')
            }

            const postfix = Template.asString([
              ';',
              '',
              '// transform swan exports to export default object expression',
              'export default {',
              Template.indent(exportsItems),
              '}'
            ])
            return new ConcatSource(prefix, source, postfix)
          }
        } else {
          const prefix = config[this.options.mode].wxs.templatePrefix
          return new ConcatSource(prefix, source)
        }
      }
    )

    mainTemplate.hooks.startup.tap('MainTemplate', (source, chunk, hash) => {
      /** @type {string[]} */
      const buf = []
      if (chunk.entryModule) {
        buf.push('// Load entry module and return exports')
        buf.push(
          `var entryExports = ${mainTemplate.renderRequireFunctionForModule(
            hash,
            chunk,
            JSON.stringify(chunk.entryModule.id)
          )}(${mainTemplate.requireFn}.s = ${JSON.stringify(chunk.entryModule.id)});`
        )
        buf.push('return entryExports && entryExports.__esModule? entryExports["default"] : entryExports;')
      }
      return Template.asString(buf)
    })

    mainTemplate.hooks.hash.tap('WxsMainTemplatePlugin', hash => {
      hash.update('wxs')
      hash.update(this.options.mode)
    })
  }
}
