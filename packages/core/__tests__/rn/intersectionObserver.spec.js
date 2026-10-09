global.__mpx_mode__ = 'ios'
global.__mpx_perf_framework__ = false
global.__mpx_dynamic_runtime__ = false
global.mpxGlobal = {}

jest.mock('@mpxjs/perf', () => ({}), { virtual: true })
jest.mock('react-native', () => ({}), { virtual: true })

// 初始化Mpx后再加载proxy，保持运行时的模块初始化顺序。
require('../../src')
const MpxProxy = require('../../src/core/proxy').default
const { BEFOREUNMOUNT, UNMOUNTED } = require('../../src/core/innerLifecycle')
const RNIntersectionObserver = require('../../../api-proxy/src/platform/api/create-intersection-observer/rnIntersectionObserver').default

describe('RN component intersection observers', () => {
  it('should disconnect every owned observer on unmount without affecting other components', () => {
    const component = {}
    const proxy = new MpxProxy({}, component)
    const intersectionCtx = {}
    const otherObserver = new RNIntersectionObserver({}, {}, intersectionCtx)
    const observers = Array.from({ length: 3 }, () => new RNIntersectionObserver(component, {}, intersectionCtx))

    proxy.unmounted()

    expect(component._intersectionObservers).toEqual([])
    expect(Object.values(intersectionCtx)).toEqual([otherObserver])
    observers.forEach(observer => {
      expect(observer.component).toBeNull()
    })
    expect(proxy.isUnmounted()).toBe(true)
    otherObserver.disconnect()
  })

  it('should tolerate manual disconnect in unmount hooks', () => {
    const component = {}
    const intersectionCtx = {}
    const first = new RNIntersectionObserver(component, {}, intersectionCtx)
    const second = new RNIntersectionObserver(component, {}, intersectionCtx)
    const unmounted = jest.fn(() => second.disconnect())
    const proxy = new MpxProxy({
      [BEFOREUNMOUNT]: () => first.disconnect(),
      [UNMOUNTED]: unmounted
    }, component)

    proxy.unmounted()

    expect(unmounted).toHaveBeenCalledTimes(1)
    expect(component._intersectionObservers).toEqual([])
    expect(intersectionCtx).toEqual({})
  })
})
