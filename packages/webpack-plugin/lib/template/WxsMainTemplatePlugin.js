const Template = require('webpack/lib/Template')
const config = require('../config')
const { ConcatSource } = require('webpack-sources')

module.exports = class WxsMainTemplatePlugin {
  constructor (options = { mode: 'wx' }) {
    this.options = options
  }

  apply (mainTemplate) {
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
        const prefix = config[this.options.mode].wxs.templatePrefix
        return new ConcatSource(prefix, source)
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
