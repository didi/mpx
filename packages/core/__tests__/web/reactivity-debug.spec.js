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

it('preserves Web options hooks and exports Vue composition hooks', () => {
  const Vue = require('vue')
  const api = require('../../src/platform/export/index.web')
  const mergeOptions = require('../../src/core/mergeOptions').default
  const { getDefaultOptions } = require('../../src/platform/patch/getDefaultOptions.web')
  const tracked = jest.fn()
  const triggered = jest.fn()
  const options = getDefaultOptions({
    type: 'component',
    rawOptions: mergeOptions({
      mpxConvertMode: 'wxToWeb',
      data: { count: 0 },
      renderTracked: tracked,
      renderTriggered: triggered
    }, 'component', true)
  })
  const instance = new Vue(Object.assign(options, {
    render (h) { return h('div', String(this.count)) }
  })).$mount()
  expect(api.onRenderTracked).toBe(Vue.onRenderTracked)
  expect(api.onRenderTriggered).toBe(Vue.onRenderTriggered)
  expect(tracked).toHaveBeenCalled()
  instance.count++
  expect(triggered.mock.calls[0][0]).toMatchObject({ key: 'count', type: 'set' })
  instance.$destroy()
})
