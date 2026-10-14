global.__mpx_mode__ = 'wx'
global.mpxGlobal = {}
global.wx = {}

jest.mock('@mpxjs/utils', () => Object.assign({}, jest.requireActual('@mpxjs/utils'), {
  error: jest.fn()
}))

jest.mock('../../src/platform/patch/pageWrapperHOC', () => {
  throw new Error('RN implementation must not load on other platforms')
})

const { pageWrapperHOC } = require('../../src')
const { error } = require('@mpxjs/utils')

describe('pageWrapperHOC public export', () => {
  it.each(['wx', 'web'])('does not load RN dependencies on %s', (mode) => {
    global.__mpx_mode__ = mode
    error.mockClear()
    expect(typeof pageWrapperHOC).toBe('function')
    expect(pageWrapperHOC(() => null)).toBeUndefined()
    expect(error).toHaveBeenCalledWith('pageWrapperHOC is only supported in React Native.')
  })
})
