import RNIntersectionObserver from '../../src/platform/api/create-intersection-observer/rnIntersectionObserver'

jest.mock('react-native', () => ({
  Dimensions: {
    get: () => ({
      width: 100,
      height: 200
    })
  }
}), { virtual: true })

jest.mock('../../src/common/js', () => ({
  getFocusedNavigation: () => ({
    layout: {
      top: 0,
      width: 100,
      height: 200,
      statusBarHeight: 0
    }
  })
}))

const waitPromise = () => new Promise(resolve => setTimeout(resolve, 0))
const VirtualMeasureContextsKey = '__mpxVirtualIntersectionObserverMeasureContexts'

function createObserver ({ measureInWindow, intersectionCtx = {}, dataset = { index: 1 } } = {}) {
  const targetRef = {
    getNodeInstance () {
      return {
        props: {
          current: {
            id: 'target',
            dataset
          }
        },
        nodeRef: {
          current: {
            measureInWindow
          }
        }
      }
    }
  }
  const component = {
    __selectRef: jest.fn(() => targetRef),
    __mpxProxy: {
      options: {}
    }
  }
  const observer = new RNIntersectionObserver(component, {
    thresholds: [0],
    throttleTime: 0
  }, intersectionCtx)
  observer.relativeToViewport()
  return observer
}

describe('RNIntersectionObserver virtual measure', () => {
  test('uses registered virtual rects on init without calling measureInWindow', async () => {
    const measureInWindow = jest.fn((cb) => cb(0, 200, 100, 50))
    const intersectionCtx = {}
    Object.defineProperty(intersectionCtx, VirtualMeasureContextsKey, {
      value: new Map()
    })
    intersectionCtx[VirtualMeasureContextsKey].set('section-list', {
      isObserveTarget () {
        return true
      },
      getObserveRects () {
        return [{
          left: 0,
          top: 10,
          right: 100,
          bottom: 60,
          width: 100,
          height: 50,
          id: 'virtual-target'
        }]
      },
      getRelativeRect () {
        return {
          left: 0,
          top: 0,
          right: 100,
          bottom: 100
        }
      }
    })
    const observer = createObserver({ measureInWindow, intersectionCtx })
    const callback = jest.fn()
    observer.observe('#target', callback)
    await waitPromise()

    expect(measureInWindow).not.toHaveBeenCalled()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback.mock.calls[0][0].boundingClientRect.top).toBe(10)
  })

  test('falls back to init measure when registered virtual context misses', async () => {
    const measureInWindow = jest.fn((cb) => cb(0, 20, 100, 50))
    const intersectionCtx = {}
    Object.defineProperty(intersectionCtx, VirtualMeasureContextsKey, {
      value: new Map()
    })
    intersectionCtx[VirtualMeasureContextsKey].set('section-list', {
      isObserveTarget () {
        return false
      },
      getObserveRects () {
        return [{
          left: 0,
          top: 10,
          right: 100,
          bottom: 60,
          width: 100,
          height: 50
        }]
      }
    })
    const observer = createObserver({ measureInWindow, intersectionCtx })
    observer.observe('#target', jest.fn())
    await waitPromise()

    expect(measureInWindow).toHaveBeenCalledTimes(1)
  })

  test('allows virtual context to opt out by observed ref dataset marker', async () => {
    const measureInWindow = jest.fn((cb) => cb(0, 20, 100, 50))
    const intersectionCtx = {}
    Object.defineProperty(intersectionCtx, VirtualMeasureContextsKey, {
      value: new Map()
    })
    intersectionCtx[VirtualMeasureContextsKey].set('section-list', {
      isObserveTarget ({ observerRefs }) {
        return !observerRefs.some((ref) => {
          return ref.getNodeInstance().props.current.dataset.mpxSectionListObserveReal
        })
      },
      getObserveRects () {
        return [{
          left: 0,
          top: 10,
          right: 100,
          bottom: 60,
          width: 100,
          height: 50
        }]
      }
    })
    const observer = createObserver({
      measureInWindow,
      intersectionCtx,
      dataset: {
        index: 1,
        mpxSectionListObserveReal: true
      }
    })
    observer.observe('#target', jest.fn())
    await waitPromise()

    expect(measureInWindow).toHaveBeenCalledTimes(1)
  })

  test('uses virtual rects without calling measureInWindow', async () => {
    const measureInWindow = jest.fn((cb) => cb(0, 200, 100, 50))
    const observer = createObserver({ measureInWindow })
    const callback = jest.fn()
    observer.observe('#target', callback)
    await waitPromise()
    callback.mockClear()
    measureInWindow.mockClear()

    observer.throttleMeasure({
      getObserveRects () {
        return [{
          left: 0,
          top: 10,
          right: 100,
          bottom: 60,
          width: 100,
          height: 50,
          id: 'virtual-target'
        }]
      },
      getRelativeRect () {
        return {
          left: 0,
          top: 0,
          right: 100,
          bottom: 100
        }
      }
    })
    await waitPromise()

    expect(measureInWindow).not.toHaveBeenCalled()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback.mock.calls[0][0].boundingClientRect.top).toBe(10)
  })

  test('force init dispatches when virtual rect ratio stays unchanged', async () => {
    const measureInWindow = jest.fn((cb) => cb(0, 10, 100, 50))
    const observer = createObserver({ measureInWindow })
    const callback = jest.fn()
    const measureContext = {
      getObserveRects () {
        return [{
          left: 0,
          top: 10,
          right: 100,
          bottom: 60,
          width: 100,
          height: 50,
          id: 'virtual-target'
        }]
      },
      getRelativeRect () {
        return {
          left: 0,
          top: 0,
          right: 100,
          bottom: 100
        }
      }
    }
    observer.observe('#target', callback)
    await waitPromise()
    callback.mockClear()
    measureInWindow.mockClear()

    observer.throttleMeasureBySource('section-list', {
      signature: 'same-ratio',
      measureContext
    })
    await waitPromise()

    expect(callback).not.toHaveBeenCalled()
    observer.throttleMeasureBySource('section-list', {
      signature: 'data-change',
      force: true,
      forceInit: true,
      measureContext
    })
    await waitPromise()

    expect(measureInWindow).not.toHaveBeenCalled()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback.mock.calls[0][0].boundingClientRect.top).toBe(10)
  })

  test('falls back to measureInWindow when virtual context misses', async () => {
    const measureInWindow = jest.fn((cb) => cb(0, 200, 100, 50))
    const observer = createObserver({ measureInWindow })
    observer.observe('#target', jest.fn())
    await waitPromise()
    measureInWindow.mockClear()

    observer.throttleMeasure({
      getObserveRects () {
        return null
      },
      getRelativeRect () {
        return {
          left: 0,
          top: 0,
          right: 100,
          bottom: 100
        }
      }
    })
    await waitPromise()

    expect(measureInWindow).toHaveBeenCalledTimes(1)
  })
})
