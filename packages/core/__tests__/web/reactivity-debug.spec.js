global.__mpx_mode__ = 'web'
global.mpxGlobal = {}

jest.mock('vue-i18n-bridge', () => ({ useI18n: jest.fn() }), { virtual: true })

it('re-exports the Vue 2.7 render debugger hooks in the Web runtime', () => {
  const Vue = require('vue')
  const api = require('../../src/platform/export/index.web')
  expect(api.onRenderTracked).toBe(Vue.onRenderTracked)
  expect(api.onRenderTriggered).toBe(Vue.onRenderTriggered)
  expect(api.onRenderTracked).toEqual(expect.any(Function))
})
