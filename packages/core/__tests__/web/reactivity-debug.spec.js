global.__mpx_mode__ = 'web'
global.__mpx_dynamic_runtime__ = false
global.mpxGlobal = {}

jest.mock('vue-i18n-bridge', () => ({ useI18n: jest.fn() }), { virtual: true })
jest.mock('@mpxjs/perf', () => ({}), { virtual: true })
jest.mock('../../src/platform/patch/lifecycle/index', () => require('../../src/platform/patch/lifecycle/index.web'))
jest.mock('../../src/platform/export/api', () => require('../../src/platform/export/api.web'))
jest.mock('../../src/platform/export/index', () => require('../../src/platform/export/index.web'))
jest.mock('../../src/platform/env/index', () => require('../../src/platform/env/index.web'))
jest.mock('@mpxjs/api-proxy', () => ({ createSelectorQuery: jest.fn(), createIntersectionObserver: jest.fn() }))

it('re-exports the Vue 2.7 render debugger hooks in the Web runtime', () => {
  const Vue = require('vue')
  const api = require('../../src/platform/export/index.web')
  expect(api.onRenderTracked).toBe(Vue.onRenderTracked)
  expect(api.onRenderTriggered).toBe(Vue.onRenderTriggered)
  expect(api.onRenderTracked).toEqual(expect.any(Function))
})

it.each([['page', false], ['component', false], ['component', true]])('drives options hooks and composition hooks in a %s with a throwing mixin: %s', async (type, throwInMixin) => {
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
  const Vue = require('vue')
  const mergeOptions = require('../../src/core/mergeOptions').default
  const { getDefaultOptions } = require('../../src/platform/patch/getDefaultOptions.web')
  const tracked = jest.fn()
  const triggered = jest.fn()
  const mixinTracked = jest.fn(() => {
    if (throwInMixin) throw new Error('mixin render tracked error')
  })
  const mixinTriggered = jest.fn(() => {
    if (throwInMixin) throw new Error('mixin render triggered error')
  })
  const api = require('../../src/platform/export/index.web')
  const compositionTracked = jest.fn()
  const compositionTriggered = jest.fn()
  const options = getDefaultOptions({
    type,
    rawOptions: mergeOptions({
      mpxConvertMode: 'wxToWeb',
      data: { count: 0 },
      mixins: [{ renderTracked: mixinTracked, renderTriggered: mixinTriggered }],
      renderTracked: tracked,
      renderTriggered: triggered,
      setup () {
        api.onRenderTracked(compositionTracked)
        api.onRenderTriggered(compositionTriggered)
        return {}
      }
    }, type, true)
  })
  const instance = new Vue(Object.assign(options, {
    render (h) { return h('div', String(this.count)) }
  })).$mount()
  expect(instance.$el.textContent).toBe('0')
  expect(tracked).toHaveBeenCalled()
  expect(tracked).toHaveBeenCalledTimes(compositionTracked.mock.calls.length)
  expect(tracked.mock.contexts.every(context => context === instance)).toBe(true)
  expect(mixinTracked.mock.invocationCallOrder[0]).toBeLessThan(tracked.mock.invocationCallOrder[0])
  expect(tracked.mock.invocationCallOrder[0]).toBeLessThan(compositionTracked.mock.invocationCallOrder[0])
  instance.count++
  expect(triggered).toHaveBeenCalledTimes(1)
  expect(triggered.mock.contexts).toEqual([instance])
  expect(triggered.mock.calls[0][0]).toBe(compositionTriggered.mock.calls[0][0])
  expect(triggered.mock.calls[0][0]).toMatchObject({ key: 'count', type: 'set' })
  expect(mixinTriggered.mock.invocationCallOrder[0]).toBeLessThan(triggered.mock.invocationCallOrder[0])
  expect(triggered.mock.invocationCallOrder[0]).toBeLessThan(compositionTriggered.mock.invocationCallOrder[0])
  await Vue.nextTick()
  expect(instance.$el.textContent).toBe('1')
  instance.$destroy()
  instance.count++
  expect(triggered).toHaveBeenCalledTimes(1)
  if (throwInMixin) expect(errors).toHaveBeenCalled()
  else expect(errors).not.toHaveBeenCalled()
  errors.mockRestore()
})

it.each([false, true])('restores the enclosing setup context after Web debug hooks (throwing: %s)', (throwInHook) => {
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
  const Vue = require('vue')
  const mergeOptions = require('../../src/core/mergeOptions').default
  const { getDefaultOptions } = require('../../src/platform/patch/getDefaultOptions.web')
  const { getCurrentInstance } = require('../../src/core/proxy')
  const { onMounted } = require('../../src')
  const debugInstances = []
  const debugHook = jest.fn(() => {
    debugInstances.push(getCurrentInstance())
    if (throwInHook) throw new Error('render debug hook error')
  })
  const source = new Vue(Object.assign(getDefaultOptions({
    type: 'component',
    rawOptions: mergeOptions({
      mpxConvertMode: 'wxToWeb',
      data: { count: 0 },
      renderTracked: debugHook,
      renderTriggered: debugHook
    }, 'component', true)
  }), { render (h) { return h('div', String(this.count)) } })).$mount()
  const mounted = jest.fn()
  let afterTracked
  let afterTriggered
  const owner = new Vue(Object.assign(getDefaultOptions({
    type: 'component',
    rawOptions: mergeOptions({
      mpxConvertMode: 'wxToWeb',
      setup () {
        source._watcher.get()
        afterTracked = getCurrentInstance()
        source.count++
        afterTriggered = getCurrentInstance()
        onMounted(mounted)
        return {}
      }
    }, 'component', true)
  }), { render (h) { return h('div') } })).$mount()

  try {
    expect(afterTracked).toBe(owner.__mpxProxy)
    expect(afterTriggered).toBe(owner.__mpxProxy)
    expect(mounted).toHaveBeenCalledTimes(1)
    expect(debugHook).toHaveBeenCalled()
    expect(debugInstances.every(instance => instance === source.__mpxProxy)).toBe(true)
    expect(getCurrentInstance()).toBeNull()
    if (throwInHook) expect(errors).toHaveBeenCalled()
    else expect(errors).not.toHaveBeenCalled()
  } finally {
    owner.$destroy()
    source.$destroy()
    errors.mockRestore()
  }
})

it('does not add the Web debug bridge in production', () => {
  const { getDefaultOptions } = require('../../src/platform/patch/getDefaultOptions.web')
  const mergeOptions = require('../../src/core/mergeOptions').default
  const previousEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  try {
    const options = getDefaultOptions({
      type: 'component',
      rawOptions: mergeOptions({
        mpxConvertMode: 'wxToWeb',
        renderTracked: jest.fn(),
        renderTriggered: jest.fn()
      }, 'component', true)
    })
    expect(options).not.toHaveProperty('renderTracked')
    expect(options).not.toHaveProperty('renderTriggered')
  } finally {
    process.env.NODE_ENV = previousEnv
  }
})
