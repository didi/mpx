global.__mpx_mode__ = 'web'

jest.mock('../../src/platform/patch/lifecycle/index', () => require('../../src/platform/patch/lifecycle/index.web'))
jest.mock('../../src/index', () => ({ prototype: {} }))
jest.mock('../../src/platform/export/inject', () => ({ initAppProvides: jest.fn() }))
jest.mock('@mpxjs/perf', () => ({}), { virtual: true })
jest.mock('@mpxjs/utils', () => Object.assign({}, jest.requireActual('@mpxjs/utils'), {
  error: jest.fn()
}))

const { implement, implemented } = require('../../src/core/implement')
const mergeOptions = require('../../src/core/mergeOptions').default
const createApp = require('../../src/platform/createApp').default
const { error } = require('@mpxjs/utils')

function convert (options, type = 'component') {
  return mergeOptions(Object.assign({ mpxConvertMode: 'wxToWeb' }, options), type, true)
}

describe('Web implement adaptation', () => {
  beforeEach(() => {
    Object.keys(implemented).forEach(key => delete implemented[key])
    jest.clearAllMocks()
  })

  it.each([
    ['moved', 'component'],
    ['error', 'component'],
    ['definitionFilter', 'component'],
    ['export', 'component'],
    ['onShareAppMessage', 'page'],
    ['onShareTimeline', 'page'],
    ['onAddToFavorites', 'page'],
    ['onSaveExitState', 'page'],
    ['onRouteDone', 'page']
  ])('handles unregistered, implemented and removed %s', (name, type) => {
    const hook = jest.fn(() => 'result')
    const unregistered = convert({ [name]: hook }, type)
    expect(unregistered).not.toHaveProperty(name)
    expect(unregistered).not.toHaveProperty(`methods.${name}`)
    expect(error).toHaveBeenCalledWith(expect.stringContaining(`Options.${name}`), undefined)

    error.mockClear()
    const processor = jest.fn()
    implement(name, { modes: ['web'], processor })
    const options = convert({ [name]: hook }, type)
    expect(processor).toHaveBeenCalledTimes(1)
    expect(hook).not.toHaveBeenCalled()
    expect((type === 'page' ? options.methods[name] : options[name])('argument')).toBe('result')
    expect(hook).toHaveBeenCalledWith('argument')
    expect(error).not.toHaveBeenCalled()

    implement(name, { modes: ['web'], remove: true })
    const removed = convert({ [name]: hook }, type)
    expect(removed).not.toHaveProperty(name)
    expect(removed).not.toHaveProperty(`methods.${name}`)
    expect(error).not.toHaveBeenCalled()
  })

  it('extracts onRouteDone from methods and preserves mixin hook order', () => {
    const calls = []
    implement('onRouteDone', { modes: ['web'] })
    const options = convert({
      mixins: [{ methods: { onRouteDone () { calls.push('mixin') } } }],
      methods: { onRouteDone () { calls.push('page') } }
    }, 'page')
    options.methods.onRouteDone()
    expect(calls).toEqual(['mixin', 'page'])
    expect(options).not.toHaveProperty('onRouteDone')
  })

  it('preserves lifetimes.error through the subsequent Web options merge', () => {
    const hook = jest.fn()
    implement('error', { modes: ['web'] })
    const options = mergeOptions(convert({ lifetimes: { error: hook } }), 'component', false)
    const exception = new Error('component error')
    options.error(exception)
    expect(hook).toHaveBeenCalledWith(exception)
  })

  it('handles onThemeChange through the App creation path', () => {
    global.currentModuleId = 'implement-app'
    const hook = jest.fn()
    createApp({ onThemeChange: hook, onLaunch: hook })
    expect(global.__mpxOptionsMap['implement-app']).not.toHaveProperty('onThemeChange')
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Options.onThemeChange'), 'implement-app')

    implement('onThemeChange', { modes: ['web'] })
    createApp({ onThemeChange: hook })
    global.__mpxOptionsMap['implement-app'].onThemeChange({ theme: 'dark' })
    expect(hook).toHaveBeenCalledWith({ theme: 'dark' })

    implement('onThemeChange', { modes: ['web'], remove: true })
    createApp({ onThemeChange: hook, onLaunch: hook })
    expect(global.__mpxOptionsMap['implement-app']).not.toHaveProperty('onThemeChange')
    expect(global.__mpxOptionsMap['implement-app'].onLaunch).toEqual(expect.any(Function))
  })

  it('does not register an implementation for another platform', () => {
    const processor = jest.fn()
    implement('onRouteDone', { modes: ['wx'], processor })
    expect(processor).not.toHaveBeenCalled()
    const options = convert({ onRouteDone () {} }, 'page')
    expect(options).not.toHaveProperty('onRouteDone')
    expect(options).not.toHaveProperty('methods.onRouteDone')
  })
})
