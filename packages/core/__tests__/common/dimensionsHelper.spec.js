jest.mock('../../src/index', () => ({
  __esModule: true,
  default: {
    config: {
      rnConfig: {
        dimensionsBase: 'window'
      }
    }
  }
}))

// eslint-disable-next-line import/first
import Mpx from '../../src/index'
// eslint-disable-next-line import/first
import { ONRESIZE } from '../../src/core/innerLifecycle'
// eslint-disable-next-line import/first
import { getSystemInfo, triggerResizeEvent } from '../../src/platform/dimensionsHelper'

describe('RN dimensions helper', () => {
  beforeEach(() => {
    Mpx.config.rnConfig = {
      dimensionsBase: 'window'
    }
    global.__mpxAppDimensionsInfo = {
      window: { width: 360, height: 640 },
      screen: { width: 720, height: 1280 }
    }
  })

  function createPageResizeContext () {
    const target = {
      onResize: jest.fn()
    }
    return {
      target,
      mpxProxy: {
        options: { __type__: 'page' },
        target,
        callHook: jest.fn()
      },
      sizeRef: {
        current: getSystemInfo()
      }
    }
  }

  it('triggers onResize only when Window changes in window mode', () => {
    const { target, mpxProxy, sizeRef } = createPageResizeContext()

    global.__mpxAppDimensionsInfo.screen = { width: 800, height: 1400 }
    triggerResizeEvent(mpxProxy, sizeRef)

    expect(mpxProxy.callHook).not.toHaveBeenCalled()
    expect(target.onResize).not.toHaveBeenCalled()

    global.__mpxAppDimensionsInfo.window = { width: 700, height: 400 }
    triggerResizeEvent(mpxProxy, sizeRef)

    const systemInfo = getSystemInfo()
    expect(systemInfo.deviceOrientation).toBe('landscape')
    expect(mpxProxy.callHook).toHaveBeenCalledWith(ONRESIZE, [systemInfo])
    expect(target.onResize).toHaveBeenCalledWith(systemInfo)
  })

  it('triggers onResize only when Screen changes in screen mode', () => {
    Mpx.config.rnConfig.dimensionsBase = 'screen'
    const { target, mpxProxy, sizeRef } = createPageResizeContext()

    global.__mpxAppDimensionsInfo.window = { width: 700, height: 400 }
    triggerResizeEvent(mpxProxy, sizeRef)

    expect(mpxProxy.callHook).not.toHaveBeenCalled()
    expect(target.onResize).not.toHaveBeenCalled()

    global.__mpxAppDimensionsInfo.screen = { width: 1400, height: 800 }
    triggerResizeEvent(mpxProxy, sizeRef)

    const systemInfo = getSystemInfo()
    expect(systemInfo.deviceOrientation).toBe('landscape')
    expect(mpxProxy.callHook).toHaveBeenCalledWith(ONRESIZE, [systemInfo])
    expect(target.onResize).toHaveBeenCalledWith(systemInfo)
  })
})
