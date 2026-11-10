global.__mpx_mode__ = 'web'

let mockIsBrowser = true
jest.mock('../../../lib/runtime/env', () => ({ get isBrowser () { return mockIsBrowser } }))
jest.mock('@mpxjs/utils', () => Object.assign({}, jest.requireActual('@mpxjs/utils'), { isBrowser: true }))
jest.mock('../../../../core/src/platform/patch/lifecycle/index', () => require('../../../../core/src/platform/patch/lifecycle/index.web'))
jest.mock('../../../../core/src/index', () => ({ prototype: {} }))
jest.mock('../../../../core/src/platform/export/inject', () => ({ initAppProvides: jest.fn() }))
jest.mock('../../../../core/src/core/transferOptions', () => (options) => ({ rawOptions: options, currentInject: { moduleId: 'app' } }))

const Vue = require('vue')
const VueRouter = require('vue-router')
const createApp = require('../../../../core/src/platform/createApp').default
const { processAppOption } = require('../../../lib/runtime/optionProcessor')
const { redirectTo, reLaunch } = require('../../../../api-proxy/src/platform/api/route/index.web')
const { onPageNotFound, offPageNotFound } = require('../../../../api-proxy/src/platform/api/app/index.web')

Vue.use(VueRouter)
Vue.config.productionTip = false
Vue.config.devtools = false

describe('Web missing entry integration', () => {
  const page = { render: h => h('div', 'page') }
  let router

  beforeEach(() => {
    mockIsBrowser = true
    global.__mpx_mode__ = 'web'
    global.__mpx = { config: { webConfig: {} } }
    global.__mpxAppCbs = { show: [], hide: [], error: [], rejection: [], pageNotFound: [] }
    global.__mpxOptionsMap = {}
    window.sessionStorage.clear()
    window.history.replaceState(null, '', '/')
    document.body.innerHTML = '<div id="app"></div>'
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    if (router?.app) router.app.$destroy()
    router = null
    jest.restoreAllMocks()
    delete global.__mpxRouter
    delete global.__mpxEventChannel
    delete global.__mpxPinia
  })

  function start (options = {}, config = {}) {
    createApp(options)
    const App = Object.assign({}, global.__mpxOptionsMap.app, { render: h => h('router-view') })
    const result = processAppOption(Object.assign({
      firstPage: 'pages/home',
      pagesMap: { 'pages/home': page, 'pages/detail': page },
      componentsMap: {},
      App,
      Vue,
      VueRouter,
      tabBarMap: {},
      el: '#app'
    }, config))
    router = global.__mpxRouter
    return result
  }

  async function ready () {
    await new Promise((resolve, reject) => router.onReady(resolve, reject))
    await Vue.nextTick()
    await Vue.nextTick()
  }

  test.each(['hash', 'history'])('%s: missing entry with restored stack notifies the App instance once', async (mode) => {
    global.__mpx.config.webConfig.routeConfig = { mode }
    window.history.replaceState(null, '', mode === 'hash' ? '/#/pages/missing?foo=bar' : '/pages/missing?foo=bar')
    window.sessionStorage.setItem('_mpx_stack_path_', JSON.stringify([{ path: '/pages/old' }]))
    const calls = []
    const onLaunch = jest.fn(() => calls.push('launch'))
    const onShow = jest.fn(() => calls.push('show'))
    const onPageNotFound = jest.fn(() => calls.push('missing'))
    start({ onLaunch, onShow, onPageNotFound })
    await ready()
    expect(router.currentRoute.path).toBe('/pages/home')
    expect(onPageNotFound).toHaveBeenCalledWith({ path: 'pages/missing', query: { foo: 'bar' }, isEntryPage: true })
    expect(onPageNotFound.mock.contexts[0]).toBe(onLaunch.mock.contexts[0])
    expect(onPageNotFound.mock.contexts[0]).not.toBe(router.app)
    expect(calls).toEqual(['launch', 'show', 'missing'])
    expect(router.__mpxPageNotFound).toBeUndefined()
    await router.push('/pages/detail')
    const onError = jest.fn()
    router.onError(onError)
    await expect(router.push('/pages/another-missing')).rejects.toThrow('is not found')
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onPageNotFound).toHaveBeenCalledTimes(1)
  })

  test.each([['redirectTo', redirectTo], ['reLaunch', reLaunch]])('%s can recover from the entry callback', async (name, api) => {
    window.history.replaceState(null, '', '/#/missing')
    const success = jest.fn()
    const onPageNotFound = jest.fn(() => api({ url: '/pages/detail', success }))
    start({ onPageNotFound })
    await ready()
    expect(router.currentRoute.path).toBe('/pages/detail')
    expect(onPageNotFound).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenCalledTimes(1)
  })

  test('missing navigation inside the callback only fails the API', async () => {
    window.history.replaceState(null, '', '/#/missing')
    const calls = []
    const onPageNotFound = jest.fn(() => redirectTo({
      url: '/another-missing',
      fail: () => calls.push('fail'),
      complete: () => calls.push('complete')
    }))
    start({ onPageNotFound })
    await ready()
    expect(calls).toEqual(['fail', 'complete'])
    expect(onPageNotFound).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.path).toBe('/pages/home')
  })

  test('without a handler the missing entry falls back and finishes navigation', async () => {
    window.history.replaceState(null, '', '/#/missing')
    const errorHandler = jest.fn()
    global.__mpx.config.errorHandler = errorHandler
    start()
    await ready()
    expect(router.currentRoute.path).toBe('/pages/home')
    expect(errorHandler).toHaveBeenCalledWith(expect.stringContaining('/missing'), undefined, expect.any(Error))
  })

  test('notifies an API listener registered in onLaunch without an App hook', async () => {
    window.history.replaceState(null, '', '/#/missing?from=api')
    const listener = jest.fn()
    const errorHandler = jest.fn()
    global.__mpx.config.errorHandler = errorHandler
    start({ onLaunch: () => onPageNotFound(listener) })
    await ready()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith({ path: 'missing', query: { from: 'api' }, isEntryPage: true })
    expect(errorHandler).not.toHaveBeenCalled()
    const lateListener = jest.fn()
    onPageNotFound(lateListener)
    const fail = jest.fn()
    redirectTo({ url: '/another-missing', fail })
    await Vue.nextTick()
    expect(fail).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(lateListener).not.toHaveBeenCalled()
  })

  test.each(['one', 'all'])('removes %s API listeners without removing the App hook', async (mode) => {
    window.history.replaceState(null, '', '/#/missing')
    const removed = jest.fn()
    const retained = jest.fn()
    const hook = jest.fn()
    onPageNotFound(removed)
    onPageNotFound(retained)
    if (mode === 'one') offPageNotFound(removed)
    else offPageNotFound()
    start({ onPageNotFound: hook })
    await ready()
    expect(removed).not.toHaveBeenCalled()
    expect(retained).toHaveBeenCalledTimes(mode === 'one' ? 1 : 0)
    expect(hook).toHaveBeenCalledTimes(1)
  })

  test.each(['/', '/alias', '/redirect', '/custom-missing'])('respects configured routes for %s', async (path) => {
    global.__mpx.config.webConfig.routeConfig = {
      routes: [
        { path: '/pages/home', component: page, alias: '/alias' },
        { path: '/', redirect: '/pages/home' },
        { path: '/redirect', redirect: '/pages/home' },
        { path: '*', component: page }
      ]
    }
    window.history.replaceState(null, '', '/#' + path)
    const onPageNotFound = jest.fn()
    start({ onPageNotFound })
    await ready()
    expect(onPageNotFound).not.toHaveBeenCalled()
  })

  test('waits for an async fallback page before notifying', async () => {
    window.history.replaceState(null, '', '/#/missing')
    let resolvePage
    const onPageNotFound = jest.fn()
    start({ onPageNotFound }, { pagesMap: { 'pages/home': () => new Promise(resolve => { resolvePage = resolve }) } })
    await Vue.nextTick()
    expect(onPageNotFound).not.toHaveBeenCalled()
    resolvePage(page)
    await ready()
    expect(onPageNotFound).toHaveBeenCalledTimes(1)
  })

  test('a registered page load error does not become a missing entry', async () => {
    window.history.replaceState(null, '', '/#/pages/home')
    const onPageNotFound = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    start({ onPageNotFound }, { pagesMap: { 'pages/home': () => Promise.reject(new Error('load failed')) } })
    await expect(ready()).rejects.toThrow('load failed')
    expect(onPageNotFound).not.toHaveBeenCalled()
    expect(router.__mpxPageNotFound).toBeUndefined()
  })

  test('SSR finishes its fallback navigation without scheduling a notification', async () => {
    mockIsBrowser = false
    global.__mpx.config.webConfig.routeConfig = { mode: 'abstract' }
    const onPageNotFound = jest.fn()
    const listener = jest.fn()
    global.__mpxAppCbs.pageNotFound.push(listener)
    const render = start({ onPageNotFound })
    await render({ url: '/missing?foo=bar' })
    router = global.__mpxRouter
    expect(router.currentRoute.path).toBe('/pages/home')
    expect(router.__mpxPageNotFound).toBeUndefined()
    expect(onPageNotFound).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
  })

  test('client hydration startup only notifies once', async () => {
    window.history.replaceState(null, '', '/#/missing')
    const onPageNotFound = jest.fn()
    start({ onPageNotFound }, { useSSR: true })
    await ready()
    expect(onPageNotFound).toHaveBeenCalledTimes(1)
  })
})
