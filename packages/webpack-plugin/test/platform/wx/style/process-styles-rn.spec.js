jest.mock('../../../../lib/helpers', () => jest.fn(() => ({
  getRequestString: jest.fn(() => JSON.stringify('style-request'))
})))

const processStyles = require('../../../../lib/react/processStyles')

describe('React Native processStyles selector validation', () => {
  test('should emit a style error for unsupported pseudo selectors', async () => {
    const loaderContext = {
      resourcePath: '/project/src/example.mpx',
      getMpx: jest.fn(() => ({
        mode: 'ios',
        srcMode: 'wx',
        hasUnoCSS: false
      })),
      importModule: jest.fn(() => Promise.resolve('.button:hover { color: red; }')),
      emitWarning: jest.fn(),
      emitError: jest.fn()
    }

    await new Promise((resolve, reject) => {
      processStyles([{}], {
        loaderContext,
        ctorType: 'component',
        autoScope: false,
        moduleId: 'example'
      }, (err) => err ? reject(err) : resolve())
    })

    expect(loaderContext.emitError).toHaveBeenCalledTimes(1)
    expect(loaderContext.emitError.mock.calls[0][0].message).toContain('[Mpx style error]')
    expect(loaderContext.emitError.mock.calls[0][0].message).toContain('Target: .button:hover')
  })
})
