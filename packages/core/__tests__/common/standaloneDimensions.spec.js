jest.mock('react-native', () => ({
  StyleSheet: { hairlineWidth: 0.5 },
  Dimensions: {
    get: () => ({ width: 360, height: 640 }),
    addEventListener: jest.fn()
  }
}), { virtual: true })

jest.mock('@mpxjs/utils', () => Object.assign({}, jest.requireActual('@mpxjs/utils'), {
  getFocusedNavigation: jest.fn()
}))
jest.mock('@mpxjs/perf', () => ({ scopeStart: jest.fn(), scopeEnd: jest.fn() }))
jest.mock('../../src/index', () => ({
  __esModule: true,
  default: { config: { rnConfig: { dimensionsBase: 'window' } } }
}))

describe('standalone RN dimensions reactivity', () => {
  let methods, syncDimensions, ReactiveEffect, getFocusedNavigation
  beforeEach(() => {
    jest.resetModules()
    global.__mpx_mode__ = 'ios'
    global.__mpx_perf__ = false
    global.__mpx_perf_framework__ = false
    global.mpxGlobal = global
    methods = require('../../src/platform/builtInMixins/styleHelperMixin.ios').default().methods
    syncDimensions = require('../../src/platform/dimensionsHelper').syncDimensions
    ReactiveEffect = require('../../src/observer/effect').ReactiveEffect
    getFocusedNavigation = require('@mpxjs/utils').getFocusedNavigation
    global.__classCaches = new Set()
    global.__mpxPageStatusMap = {}
  })

  it('refreshes standalone responsive styles while leaving fixed and background-page styles untouched', () => {
    const contexts = [undefined, undefined, 1, 2].map(__pageId => ({
      __pageId,
      __trackPageSizeCount: methods.__trackPageSizeCount
    }))
    const units = ['750rpx', '100px', '100vw', '100vw']
    const updates = contexts.map(() => jest.fn())
    const effects = contexts.map((context, index) => new ReactiveEffect(() =>
      methods.__getStyle.call(context, '', '', '', { width: units[index] }), updates[index]))
    const { set } = require('../../src/observer/reactive')
    set(global.__mpxPageSizeCountMap, 1, 0)
    set(global.__mpxPageSizeCountMap, 2, 0)
    effects.forEach(effect => effect.run())
    getFocusedNavigation.mockReturnValue({ pageId: 1 })

    syncDimensions({ window: { width: 720, height: 640 }, screen: { width: 720, height: 640 } })

    expect(updates.map(update => update.mock.calls.length)).toEqual([1, 0, 1, 0])
    expect(effects[0].run().width).toBe(720)
    expect(effects[2].run().width).toBe(720)
    effects.forEach(effect => effect.stop())
  })

  it('refreshes without navigation and unsubscribes after unmount', () => {
    const update = jest.fn()
    const context = { __trackPageSizeCount: methods.__trackPageSizeCount }
    const effect = new ReactiveEffect(() => methods.__getStyle.call(context, '', '', '', { height: '100vh' }), update)
    expect(effect.run().height).toBe(640)
    const next = { window: { width: 360, height: 800 }, screen: { width: 360, height: 800 } }
    syncDimensions(next)
    expect(update).toHaveBeenCalledTimes(1)
    expect(effect.run().height).toBe(800)
    syncDimensions(next)
    expect(update).toHaveBeenCalledTimes(1)
    effect.stop()
    syncDimensions({ window: { width: 360, height: 900 }, screen: next.screen })
    expect(update).toHaveBeenCalledTimes(1)
  })
})
