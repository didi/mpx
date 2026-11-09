global.__mpx_mode__ = 'ios'

jest.mock('@mpxjs/utils', () => Object.assign({}, jest.requireActual('@mpxjs/utils'), {
  error: jest.fn()
}))

const { implement, implemented } = require('../../src/core/implement')
const mergeOptions = require('../../src/core/mergeOptions').default
const { error } = require('@mpxjs/utils')

function convert (options, type = 'component') {
  const modes = { ios: 'wxToIos', android: 'wxToAndroid', harmony: 'wxToHarmony' }
  return mergeOptions(Object.assign({ mpxConvertMode: modes[global.__mpx_mode__] }, options), type, true)
}

describe.each(['ios', 'android', 'harmony'])('RN implement adaptation on %s', (mode) => {
  beforeEach(() => {
    global.__mpx_mode__ = mode
    Object.keys(implemented).forEach(key => delete implemented[key])
    jest.clearAllMocks()
  })

  it.each([
    ['moved', 'component'],
    ['error', 'component'],
    ['definitionFilter', 'component'],
    ['export', 'component'],
    ['onShareTimeline', 'page'],
    ['onAddToFavorites', 'page'],
    ['onSaveExitState', 'page'],
    ['onRouteDone', 'page'],
    ['onPullDownRefresh', 'page'],
    ['onReachBottom', 'page'],
    ['onPageScroll', 'page'],
    ['onTabItemTap', 'page']
  ])('handles unregistered, implemented and removed %s', (name, type) => {
    const hook = jest.fn(() => 'result')
    const path = type === 'page' ? `methods.${name}` : name
    expect(convert({ [name]: hook }, type)).not.toHaveProperty(path)
    expect(error).toHaveBeenCalledWith(expect.stringContaining(`Options.${name}`), undefined)

    error.mockClear()
    const processor = jest.fn()
    implement(name, { modes: [mode], processor })
    const options = convert({ [name]: hook }, type)
    expect(processor).toHaveBeenCalledTimes(1)
    expect(hook).not.toHaveBeenCalled()
    expect((type === 'page' ? options.methods[name] : options[name])('argument')).toBe('result')
    expect(hook).toHaveBeenCalledWith('argument')
    expect(error).not.toHaveBeenCalled()

    implement(name, { modes: [mode], remove: true })
    expect(convert({ [name]: hook }, type)).not.toHaveProperty(path)
    expect(error).not.toHaveBeenCalled()
  })

  it('preserves the existing share hook without implement registration', () => {
    const hook = jest.fn(() => ({ title: 'share' }))
    const options = convert({ onShareAppMessage: hook }, 'page')
    expect(options.methods.onShareAppMessage()).toEqual({ title: 'share' })
    expect(error).not.toHaveBeenCalled()
  })

  it('merges route and component error hooks through both conversion stages', () => {
    implement('onRouteDone', { modes: [mode] })
    implement('error', { modes: [mode] })
    const calls = []
    const page = mergeOptions(convert({
      mixins: [{ methods: { onRouteDone () { calls.push('mixin') } } }],
      methods: { onRouteDone () { calls.push('page') } }
    }, 'page'), 'page', false)
    page.methods.onRouteDone()
    expect(calls).toEqual(['mixin', 'page'])

    const hook = jest.fn()
    const component = mergeOptions(convert({ lifetimes: { error: hook } }), 'component', false)
    const exception = new Error('component error')
    component.error(exception)
    expect(hook).toHaveBeenCalledWith(exception)
  })

  it('does not apply a Web-only implementation', () => {
    const processor = jest.fn()
    implement('onRouteDone', { modes: ['web'], processor })
    expect(processor).not.toHaveBeenCalled()
    expect(convert({ onRouteDone () {} }, 'page')).not.toHaveProperty('methods.onRouteDone')
  })
})
