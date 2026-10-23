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

it('uses Vue render hooks for options and composition, including lifecycle error handling', async () => {
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
  const Vue = require('vue')
  const api = require('../../src/platform/export/index.web')
  const mergeOptions = require('../../src/core/mergeOptions').default
  const { getDefaultOptions } = require('../../src/platform/patch/getDefaultOptions.web')
  const tracked = jest.fn()
  const triggered = jest.fn()
  const compositionTracked = jest.fn()
  const compositionTriggered = jest.fn()
  let throwInMixin = false
  const mixinTriggered = jest.fn(() => {
    if (throwInMixin) throw new Error('mixin render hook error')
  })
  const options = getDefaultOptions({
    type: 'component',
    rawOptions: mergeOptions({
      mpxConvertMode: 'wxToWeb',
      data: { count: 0 },
      mixins: [{ renderTriggered: mixinTriggered }],
      renderTracked: tracked,
      renderTriggered: triggered,
      setup () {
        api.onRenderTracked(compositionTracked)
        api.onRenderTriggered(compositionTriggered)
        return {}
      }
    }, 'component', true)
  })
  const instance = new Vue(Object.assign(options, {
    render (h) { return h('div', String(this.count)) }
  })).$mount()
  expect(api.onRenderTracked).toBe(Vue.onRenderTracked)
  expect(tracked).toHaveBeenCalled()
  expect(tracked.mock.contexts.every(context => context === instance)).toBe(true)
  expect(tracked.mock.invocationCallOrder[0]).toBeLessThan(compositionTracked.mock.invocationCallOrder[0])
  instance.count++
  expect(triggered.mock.calls[0][0]).toBe(compositionTriggered.mock.calls[0][0])
  expect(triggered.mock.calls[0][0]).toMatchObject({ key: 'count', type: 'set' })
  await Vue.nextTick()
  expect(instance.$el.textContent).toBe('1')
  throwInMixin = true
  instance.count++
  expect(triggered).toHaveBeenCalledTimes(1)
  expect(compositionTriggered).toHaveBeenCalledTimes(2)
  expect(errors).toHaveBeenCalled()
  instance.$destroy()
  instance.count++
  expect(compositionTriggered).toHaveBeenCalledTimes(2)
  errors.mockRestore()
})
