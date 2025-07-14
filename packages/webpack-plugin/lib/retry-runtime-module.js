const Template = require('webpack/lib/Template')
const RuntimeModule = require('webpack/lib/RuntimeModule')

const RetryRuntimeGlobal = '__webpack_require__.__retry'

class RetryRuntimeModule extends RuntimeModule {
  constructor() {
    super('mpx retry module')
  }

  generate () {
    const { compilation } = this
    const { runtimeTemplate } = compilation
    return Template.asString([
      `${RetryRuntimeGlobal} = ${runtimeTemplate.basicFunction(
        'fn, times, interval',
        [
          `return new Promise(${runtimeTemplate.basicFunction(
            'resolve, reject',
            [
              Template.indent([
                'var _t = 0;',
                `var _retry = ${runtimeTemplate.basicFunction('', [
                  Template.indent([
                    `fn().then(resolve).catch(${runtimeTemplate.basicFunction('err', [
                      Template.indent([
                        '_t++;',
                        'console.log("the _t is:", _t)',
                        'if (_t < times) {',
                          Template.indent([
                            // todo interval 有值的时候才是异步的？
                            'setTimeout(_retry, interval);'
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
              ]),
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
