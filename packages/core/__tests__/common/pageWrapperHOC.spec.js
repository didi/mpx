global.__mpx_mode__ = 'wx'
global.mpxGlobal = {}
global.wx = {}

jest.mock('@mpxjs/utils', () => Object.assign({}, jest.requireActual('@mpxjs/utils'), {
  error: jest.fn()
}))

jest.mock('../../src/platform/patch/pageWrapperHOC.ios', () => {
  throw new Error('RN implementation must not load on other platforms')
})

describe('pageWrapperHOC public export', () => {
  it.each(['wx', 'web'])('reports unsupported usage without loading RN dependencies on %s', (mode) => {
    global.__mpx_mode__ = mode
    jest.isolateModules(() => {
      const { pageWrapperHOC } = require('../../src')
      const { error } = require('@mpxjs/utils')
      error.mockClear()
      expect(pageWrapperHOC(() => null)).toBeUndefined()
      expect(error).toHaveBeenCalledWith('pageWrapperHOC is only supported in React Native.')
    })
  })
})
