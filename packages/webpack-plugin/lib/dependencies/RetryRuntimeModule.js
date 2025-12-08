const Template = require('webpack/lib/Template')
const RuntimeModule = require('webpack/lib/RuntimeModule')

const RetryRuntimeGlobal = '__webpack_require__.mpxR'

class RetryRuntimeModule extends RuntimeModule {
  constructor () {
    super('mpx retry module')
  }

  generate () {
    const { compilation } = this
    const { runtimeTemplate } = compilation
    return Template.asString([
      `${RetryRuntimeGlobal} = ${runtimeTemplate.basicFunction(
        'fn, times, interval',
        [
          'times = times || 1;',
          'interval = interval || 0;',
          `return new Promise(${runtimeTemplate.basicFunction(
            'resolve, reject',
            [
              Template.indent([
                'var _t = 0;',
                `var _retry = ${runtimeTemplate.basicFunction('', [
                  Template.indent([
                    `fn().then(resolve).catch(${runtimeTemplate.basicFunction('err', [
                      Template.indent([
                        'if (_t < times) {',
                        Template.indent([
                            '++_t;',
                            'interval > 0 ? setTimeout(_retry, interval) : _retry()'
                          ]),
                        '} else {',
                          Template.indent([
                            'reject(err);'
                          ]),
                        '}'
                      ])
                    ])})`
                  ])
                ])};`,
                '_retry();'
              ])
            ]
          )})`
        ]
      )}`
    ])
  }
}

module.exports = {
  RetryRuntimeModule,
  RetryRuntimeGlobal
}
