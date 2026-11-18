import { setFocusedNavigation } from '@mpxjs/utils'
import RNIntersectionObserver from '../../src/platform/api/create-intersection-observer/rnIntersectionObserver'

jest.mock('react-native', () => ({
  Dimensions: {
    get: () => ({ width: 100, height: 100 })
  }
}), { virtual: true })

function createNodeRef (id, measure = jest.fn(callback => callback(0, 0, 20, 20, 10, 10))) {
  const instance = {
    nodeRef: { current: { measure } },
    props: { current: { id, dataset: {} } }
  }
  return { getNodeInstance: () => instance }
}

describe('RN IntersectionObserver lifecycle', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    global.mpxGlobal = { __mpx: { config: { warnHandler: jest.fn(), errorHandler: jest.fn() } } }
    setFocusedNavigation({
      isFocused: () => true,
      layout: { top: 0, width: 100, height: 100, statusBarHeight: 0 }
    })
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    setFocusedNavigation(null)
    delete global.mpxGlobal
  })

  it('should release registrations on repeated create and disconnect', () => {
    const component = {}
    const intersectionCtx = {}
    const retainedObserver = new RNIntersectionObserver(component, {}, intersectionCtx)

    Array.from({ length: 1000 }).forEach(() => {
      const observer = new RNIntersectionObserver(component, {}, intersectionCtx)
      observer.disconnect()
      observer.disconnect()
    })

    expect(Object.values(intersectionCtx)).toEqual([retainedObserver])
    expect(component._intersectionObservers).toEqual([retainedObserver])
    retainedObserver.disconnect()
    expect(intersectionCtx).toEqual({})
    expect(component._intersectionObservers).toEqual([])
    expect(mpxGlobal.__mpx.config.warnHandler).not.toHaveBeenCalled()
    expect(mpxGlobal.__mpx.config.errorHandler).not.toHaveBeenCalled()
  })

  it('should not retain an observer when context registration fails', () => {
    const component = {}
    const intersectionCtx = Object.preventExtensions({})

    expect(() => new RNIntersectionObserver(component, {}, intersectionCtx)).toThrow(TypeError)
    expect(component._intersectionObservers).toBeUndefined()
    expect(intersectionCtx).toEqual({})
  })

  it('should preserve initial and threshold-crossing callbacks', async () => {
    let top = 10
    const target = createNodeRef('item', jest.fn(callback => callback(0, 0, 20, 20, 10, top)))
    const component = { __selectRef: () => target }
    const callback = jest.fn()
    const observer = new RNIntersectionObserver(component, { thresholds: [0, 1] }, {})

    observer.relativeToViewport().observe('.item', callback)
    await jest.advanceTimersByTimeAsync(0)
    expect(callback).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'item', intersectionRatio: 1 }))

    top = 200
    observer.throttleMeasure()
    await jest.advanceTimersByTimeAsync(0)
    expect(callback).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'item', intersectionRatio: 0 }))
    expect(callback).toHaveBeenCalledTimes(2)
    observer.disconnect()
  })

  it('should prevent trailing measurements and remove observer registrations', async () => {
    const measure = jest.fn(callback => callback(0, 0, 20, 20, 10, 10))
    const target = createNodeRef('item', measure)
    const component = { __selectRef: jest.fn(() => target) }
    const callback = jest.fn()
    const intersectionCtx = {}
    const observer = new RNIntersectionObserver(component, {}, intersectionCtx)

    observer.relativeToViewport().observe('.item', callback)
    await jest.advanceTimersByTimeAsync(0)
    observer.throttleMeasure()
    observer.throttleMeasure()
    expect(jest.getTimerCount()).toBeGreaterThan(0)
    const measurements = measure.mock.calls.length

    observer.disconnect()
    await jest.advanceTimersByTimeAsync(100)

    expect(jest.getTimerCount()).toBe(0)
    expect(measure).toHaveBeenCalledTimes(measurements)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(component.__selectRef).toHaveBeenCalledTimes(1)
    expect(observer.component).toBeNull()
    expect(component._intersectionObservers).toEqual([])
    expect(intersectionCtx).toEqual({})
  })

  it('should report errors without throwing or restarting observation when a disconnected observer is reused', async () => {
    const measure = jest.fn(callback => callback(0, 0, 20, 20, 10, 10))
    const component = {
      __mpxProxy: { options: { mpxFileResource: 'observer-test.mpx' } },
      __selectRef: jest.fn(() => createNodeRef('item', measure))
    }
    const callback = jest.fn()
    const reuseCallback = jest.fn()
    const observer = new RNIntersectionObserver(component, {}, {})

    observer.relativeToViewport().observe('.item', callback)
    await jest.advanceTimersByTimeAsync(0)
    observer.disconnect()

    expect(observer.relativeTo('.item')).toBe(observer)
    expect(observer.relativeToViewport()).toBe(observer)
    expect(observer.observe('.item', reuseCallback)).toBeUndefined()
    await jest.advanceTimersByTimeAsync(100)

    const errorHandler = mpxGlobal.__mpx.config.errorHandler
    expect(errorHandler).toHaveBeenCalledTimes(3)
    expect(mpxGlobal.__mpx.config.warnHandler).not.toHaveBeenCalled()
    ;['relativeTo', 'relativeToViewport', 'observe'].forEach((method, index) => {
      expect(errorHandler).toHaveBeenNthCalledWith(index + 1,
        `"${method}" cannot be called after disconnect in IntersectionObserver. Please create a new observer.`,
        'observer-test.mpx', expect.any(Error))
    })
    expect(component.__selectRef).toHaveBeenCalledTimes(1)
    expect(measure).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(reuseCallback).not.toHaveBeenCalled()
  })

  it('should report repeated observe calls without replacing the original callback', async () => {
    const target = createNodeRef('item')
    const component = { __selectRef: jest.fn(() => target) }
    const callback = jest.fn()
    const repeatedCallback = jest.fn()
    const observer = new RNIntersectionObserver(component, {}, {})

    observer.relativeToViewport().observe('.item', callback)
    observer.observe('.item', repeatedCallback)
    await jest.advanceTimersByTimeAsync(0)

    expect(mpxGlobal.__mpx.config.errorHandler).toHaveBeenCalledTimes(1)
    expect(mpxGlobal.__mpx.config.errorHandler).toHaveBeenCalledWith(
      '"observe" call can be only called once in IntersectionObserver', '', expect.any(Error))
    expect(mpxGlobal.__mpx.config.warnHandler).not.toHaveBeenCalled()
    expect(component.__selectRef).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(repeatedCallback).not.toHaveBeenCalled()
    observer.disconnect()
  })

  it('should ignore native measurement results arriving after disconnect', async () => {
    let finishMeasure
    const target = createNodeRef('item', callback => { finishMeasure = callback })
    const component = { __selectRef: () => target }
    const callback = jest.fn()
    const observer = new RNIntersectionObserver(component, {}, {})

    observer.relativeToViewport().observe('.item', callback)
    observer.disconnect()
    finishMeasure(0, 0, 20, 20, 10, 10)
    await jest.advanceTimersByTimeAsync(0)

    expect(callback).not.toHaveBeenCalled()
    expect(mpxGlobal.__mpx.config.warnHandler).not.toHaveBeenCalled()
  })

  it('should stop the current callback batch when disconnected from a callback', async () => {
    const targets = [createNodeRef('first'), createNodeRef('second')]
    const component = { __selectRef: () => targets }
    const observer = new RNIntersectionObserver(component, { observeAll: true }, {})
    const callback = jest.fn(() => observer.disconnect())

    observer.relativeToViewport().observe('.item', callback)
    await jest.advanceTimersByTimeAsync(0)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ id: 'first' }))
    expect(component._intersectionObservers).toEqual([])
    expect(mpxGlobal.__mpx.config.warnHandler).not.toHaveBeenCalled()
  })
})

describe('RN IntersectionObserver root-relative viewport', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    global.mpxGlobal = { __mpx: { config: { warnHandler: jest.fn(), errorHandler: jest.fn() } } }
  })
  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    setFocusedNavigation(null)
    delete global.mpxGlobal
  })

  it.each([
    ['root origin', 0, 0, 16, 100, 1],
    ['navigation header offset', 77, 33, 16, 177, 1],
    ['fractional status bar without compensation', 0, 35.84, 16, 300, 1],
    ['top half clipped', 91, 35.84, 16, 41, 0.5],
    ['bottom half clipped', 91, 35.84, 16, 666, 0.5],
    ['left half clipped', 0, 0, -120, 100, 0.5],
    ['right half clipped', 0, 0, 262, 100, 0.5]
  ])('measures %s relative to the RN root', async (name, top, statusBarHeight, targetX, targetY, ratio) => {
    setFocusedNavigation({
      isFocused: () => true,
      layout: { left: 0, top, width: 382, height: 625, statusBarHeight }
    })
    const target = createNodeRef('item', callback => callback(1, 2, 240, 100, targetX, targetY))
    const observer = new RNIntersectionObserver({ __selectRef: () => target }, { initialRatio: -1 }, {})
    const callback = jest.fn()
    observer.relativeToViewport().observe('.item', callback)
    await jest.advanceTimersByTimeAsync(0)
    expect(callback).toHaveBeenLastCalledWith(expect.objectContaining({
      intersectionRatio: ratio,
      boundingClientRect: { left: targetX, top: targetY, right: targetX + 240, bottom: targetY + 100, width: 240, height: 100 },
      relativeRect: { left: 0, top, right: 382, bottom: top + 625 }
    }))
    observer.disconnect()
  })

  it('reuses the viewport until navigation layout changes', () => {
    const navigation = {
      isFocused: () => true,
      layout: { left: 0, top: 44, width: 382, height: 625 }
    }
    setFocusedNavigation(navigation)
    const observer = new RNIntersectionObserver({}, {}, {})
    observer.relativeToViewport({ left: 10, top: 20, right: 30, bottom: 40 })
    const initialRect = observer._getWindowRect()
    expect(initialRect).toEqual({ left: -10, top: 24, right: 412, bottom: 709 })
    expect(observer._getWindowRect()).toBe(initialRect)
    navigation.layout = { left: 0, top: 55, width: 200, height: 300 }
    const resizedRect = observer._getWindowRect()
    expect(resizedRect).toEqual({ left: -10, top: 35, right: 230, bottom: 395 })
    expect(resizedRect).not.toBe(initialRect)
    expect(observer._getWindowRect()).toBe(resizedRect)
    observer.disconnect()
  })

  it('remeasures targets and the scroll-view reference when scrolling triggers detection', async () => {
    let top = 450
    const targetMeasure = jest.fn(callback => callback(0, 0, 100, 100, 20, top))
    const referenceMeasure = jest.fn(callback => callback(0, 0, 382, 400, 0, 100))
    const target = createNodeRef('item', targetMeasure)
    const reference = createNodeRef('scroll', referenceMeasure)
    const intersectionCtx = {}
    const observer = new RNIntersectionObserver({ __selectRef: selector => selector === '.scroll' ? reference : target }, { thresholds: [0, 1] }, intersectionCtx)
    const callback = jest.fn()
    observer.relativeTo('.scroll').observe('.item', callback)
    await jest.advanceTimersByTimeAsync(0)
    expect(callback).toHaveBeenLastCalledWith(expect.objectContaining({ intersectionRatio: 0.5 }))

    top = 350
    intersectionCtx[observer.id].throttleMeasure()
    await jest.advanceTimersByTimeAsync(100)
    expect(callback).toHaveBeenLastCalledWith(expect.objectContaining({ intersectionRatio: 1 }))

    top = -100
    intersectionCtx[observer.id].throttleMeasure()
    await jest.advanceTimersByTimeAsync(100)
    expect(callback).toHaveBeenLastCalledWith(expect.objectContaining({ intersectionRatio: 0 }))
    expect(targetMeasure).toHaveBeenCalledTimes(3)
    expect(referenceMeasure).toHaveBeenCalledTimes(3)
    observer.disconnect()
  })
})
