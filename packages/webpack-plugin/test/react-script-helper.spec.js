const vm = require('vm')
const { buildGlobalParams } = require('../lib/react/script-helper')

function initialize (runtime, ctorType, hasApp, externalClasses) {
  const content = buildGlobalParams({
    moduleId: 'test',
    srcMode: 'wx',
    loaderContext: {
      getMpx: () => ({ externalClasses }),
      resourcePath: '/test.mpx'
    },
    isProduction: true,
    ctorType,
    jsonConfig: {},
    componentsMap: {},
    pagesMap: {},
    outputPath: 'test',
    hasApp
  })
  vm.runInNewContext(content, { global: runtime })
}

describe('RN external classes initialization', () => {
  test.each(['component', 'page'])('initializes a standalone %s without an App', ctorType => {
    const runtime = { currentInject: {} }
    initialize(runtime, ctorType, false, ['custom-class', 'i-class'])
    expect(Array.from(runtime.__externalClasses)).toEqual(['custom-class', 'i-class'])
  })

  test('assigns the configured classes without merging previous values', () => {
    const runtime = { currentInject: {}, __externalClasses: ['previous-class'] }
    initialize(runtime, 'component', false, ['theme-class'])
    expect(Array.from(runtime.__externalClasses)).toEqual(['theme-class'])
    initialize(runtime, 'app', true, ['custom-class', 'i-class'])
    expect(Array.from(runtime.__externalClasses)).toEqual(['custom-class', 'i-class'])
  })

  test('leaves App configuration intact for ordinary components', () => {
    const runtime = { currentInject: {}, __externalClasses: ['custom-class'] }
    initialize(runtime, 'component', true, ['other-class'])
    expect(runtime.__externalClasses).toEqual(['custom-class'])
  })
})
