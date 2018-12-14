const Template = require('webpack/lib/Template')

module.exports = class WxsMainTemplatePlugin {
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
        return ''
      }
    )
    mainTemplate.hooks.hash.tap('NodeMainTemplatePlugin', hash => {
      hash.update('wxs')
      hash.update('4')
    })
  }
}
