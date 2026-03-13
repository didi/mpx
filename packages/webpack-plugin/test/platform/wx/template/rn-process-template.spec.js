const processTemplate = require('../../../../lib/react/processTemplate')

describe('processTemplate RN dependency collection', () => {
  const mockContext = {
    context: '/project/src',
    resource: '/project/src/index.mpx',
    getMpx: () => ({
      mode: 'ios',
      srcMode: 'wx',
      defs: {},
      projectRoot: '/project',
      env: '',
      wxsContentMap: {},
      decodeHTMLText: false,
      externalClasses: [],
      checkUsingComponents: false
    }),
    emitWarning: jest.fn(),
    emitError: jest.fn(),
    _module: null
  }

  it('should only collect built-in components from current template', (done) => {
    const template = {
      content: '<import src="./child.wxml" /><view>main</view>'
    }

    processTemplate(template, {
      loaderContext: mockContext,
      hasComment: false,
      isNative: false,
      srcMode: 'wx',
      moduleId: 'testModule',
      ctorType: 'app',
      usingComponentsInfo: {}
    }, (err, result) => {
      expect(err).toBeNull()
      expect(result.builtInComponentsMap).toHaveProperty('mpx-view')
      expect(result.builtInComponentsMap).not.toHaveProperty('mpx-movable-view')
      done()
    })
  })
})
