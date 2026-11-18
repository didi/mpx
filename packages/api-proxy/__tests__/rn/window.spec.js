const mockAddEventListener = jest.fn()

jest.mock('react-native', () => ({
  Dimensions: { addEventListener: mockAddEventListener }
}), { virtual: true })

const originalGetDimensionsInfo = global.getDimensionsInfo
const originalWindowChange = global.__mpxWindowResizeHandler
let onWindowResize, offWindowResize, callback

describe('RN window resize notifications', () => {
  beforeEach(() => {
    jest.resetModules()
    mockAddEventListener.mockClear()
    const api = require('../../src/platform/api/window/rnWindow')
    onWindowResize = api.onWindowResize
    offWindowResize = api.offWindowResize
    const dimensions = {
      window: { width: 390, height: 800 },
      screen: { width: 430, height: 844 }
    }
    global.getDimensionsInfo = jest.fn(base => dimensions[base || 'window'])
    callback = jest.fn()
    onWindowResize(callback)
  })

  afterEach(() => {
    offWindowResize(callback)
    global.getDimensionsInfo = originalGetDimensionsInfo
    global.__mpxWindowResizeHandler = originalWindowChange
  })

  test('initializes the baseline once when subscribing without dispatching a resize', () => {
    expect(global.getDimensionsInfo).toHaveBeenCalledTimes(1)
    expect(callback).not.toHaveBeenCalled()
    onWindowResize(jest.fn())
    expect(global.getDimensionsInfo).toHaveBeenCalledTimes(1)
    offWindowResize()
  })

  test.each(['ios', 'android', 'harmony'])('uses the shared notification without another native listener on %s', mode => {
    global.__mpx_mode__ = mode
    expect(mockAddEventListener).not.toHaveBeenCalled()
    expect(callback).not.toHaveBeenCalled()
    global.__mpxWindowResizeHandler({ width: 390, height: 800 })
    expect(callback).toHaveBeenCalledWith({ size: { windowWidth: 390, windowHeight: 800 } })
  })

  test('dispatches the latest processed dimensions without re-reading the cache', () => {
    global.getDimensionsInfo = jest.fn(() => ({ width: 1, height: 1 }))
    global.__mpxWindowResizeHandler({ width: 320, height: 600 })
    global.__mpxWindowResizeHandler({ width: 600, height: 320 })
    expect(callback).toHaveBeenNthCalledWith(1, { size: { windowWidth: 320, windowHeight: 600 } })
    expect(callback).toHaveBeenNthCalledWith(2, { size: { windowWidth: 600, windowHeight: 320 } })
    expect(global.getDimensionsInfo).not.toHaveBeenCalled()
  })

  test.each(['window', 'screen'])('dispatches processed %s dimensions from the synchronization hook', base => {
    const dimensions = {
      window: { width: 320, height: 600 },
      screen: { width: 360, height: 700 }
    }
    global.__mpxWindowResizeHandler(dimensions[base])
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith({
      size: { windowWidth: dimensions[base].width, windowHeight: dimensions[base].height }
    })
  })

  test('keeps remaining callbacks and clears the hook after the last unsubscribe', () => {
    const retained = jest.fn()
    onWindowResize(retained)
    offWindowResize(callback)
    global.__mpxWindowResizeHandler({ width: 640, height: 360 })
    expect(callback).not.toHaveBeenCalled()
    expect(retained).toHaveBeenCalledWith({ size: { windowWidth: 640, windowHeight: 360 } })
    offWindowResize(retained)
    expect(global.__mpxWindowResizeHandler).toBeUndefined()
    onWindowResize(callback)
    global.__mpxWindowResizeHandler({ width: 400, height: 700 })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  test('removes all subscriptions when callback is omitted', () => {
    onWindowResize(jest.fn())
    offWindowResize()
    expect(global.__mpxWindowResizeHandler).toBeUndefined()
    offWindowResize()
    expect(global.__mpxWindowResizeHandler).toBeUndefined()
  })

  test('does not remove a hook replaced by another owner', () => {
    const replacement = jest.fn()
    global.__mpxWindowResizeHandler = replacement
    offWindowResize(callback)
    expect(global.__mpxWindowResizeHandler).toBe(replacement)
  })
})
