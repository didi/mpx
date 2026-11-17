const mockNativeDimensions = { window: { width: 360, height: 640 }, screen: { width: 720, height: 1280 } }

jest.mock('react', () => Object.assign({}, jest.requireActual('react'), {
  useEffect: jest.fn(),
  useState: value => [typeof value === 'function' ? value() : value, jest.fn()]
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 10 })
}), { virtual: true })
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'AnimatedView' },
  useSharedValue: value => ({ value }),
  useAnimatedStyle: callback => callback(),
  withTiming: value => value,
  Easing: { inOut: value => value, out: value => value, poly: value => value }
}), { virtual: true })

jest.mock('react-native', () => ({
  useWindowDimensions: () => mockNativeDimensions.window,
  Dimensions: {
    get: type => mockNativeDimensions[type],
    addEventListener: jest.fn(() => ({ remove: jest.fn() }))
  },
  StyleSheet: { create: styles => styles },
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  ActivityIndicator: 'ActivityIndicator',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  TextInput: 'TextInput'
}), { virtual: true })
jest.mock('react/jsx-runtime', () => ({
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props })
}), { virtual: true })
jest.mock('../../src/common/js', () => ({
  getFocusedNavigation: jest.fn(() => ({})),
  getCurrentPageId: () => 1,
  successHandle: jest.fn(),
  failHandle: jest.fn()
}))
jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/index', () => ({
  add: jest.fn(() => 1), remove: jest.fn()
}), { virtual: true })

const { showActionSheet } = require('../../src/platform/api/action-sheet/rnActionSheet')
const { showModal } = require('../../src/platform/api/modal/rnModal')
const { showToast } = require('../../src/platform/api/toast/rnToast')
const { onWindowResize, offWindowResize } = require('../../src/platform/api/window/rnWindow')
const Observer = require('../../src/platform/api/create-intersection-observer/rnIntersectionObserver').default
const portal = require('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/index')
const { getFocusedNavigation } = require('../../src/common/js')

function stylesIn (node) {
  if (Array.isArray(node)) return node.flatMap(stylesIn)
  if (!node || !node.props) return []
  if (typeof node.type === 'function') return stylesIn(node.type(node.props))
  const styles = node.props.style ? [].concat(node.props.style) : []
  return styles.concat([].concat(node.props.children || []).flatMap(stylesIn))
}

function expectSheetDimensions ({ width, height }) {
  showActionSheet({ itemList: ['first'] })
  const sheet = portal.add.mock.calls[portal.add.mock.calls.length - 1][0]
  const view = sheet.type(sheet.props)
  expect(view.props.style).toContainEqual({ width, height })
}

function expectVisualDimensions ({ width, height }, top = 0) {
  showModal({ title: 'dimensions', content: 'content' })
  const modal = portal.add.mock.calls[portal.add.mock.calls.length - 1][0]
  expect(stylesIn(modal)).toContainEqual(expect.objectContaining({ width: width * 0.8 }))
  expect(stylesIn(modal)).toContainEqual(expect.objectContaining({ maxHeight: height * 0.45 }))
  showToast({ title: 'dimensions', icon: 'none' })
  const toast = portal.add.mock.calls[portal.add.mock.calls.length - 1][0]
  expect(stylesIn(toast)).toContainEqual(expect.objectContaining({ marginTop: parseInt(height * 0.4) }))
  expectSheetDimensions({ width, height })
  const rect = Observer.prototype._getWindowRect.call({ margins: { top: 0, bottom: 0, left: 0, right: 0 } })
  expect(rect).toEqual({ top, left: 0, right: width, bottom: top + height })
}

function expectResizeDimensions ({ width, height }) {
  const callback = jest.fn()
  onWindowResize(callback)
  try {
    global.__mpxWindowResizeHandler({ width, height })
    expect(callback).toHaveBeenCalledWith({ size: { windowWidth: width, windowHeight: height } })
  } finally {
    offWindowResize(callback)
  }
}

describe.each(['ios', 'android'])('%s APIs follow the configured dimensions base', mode => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    global.__mpx_mode__ = mode
    delete global.getDimensionsInfo
    getFocusedNavigation.mockReturnValue({})
  })
  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    delete global.getDimensionsInfo
  })

  it.each([undefined, 'window', 'screen'])('uses the no-argument getter with dimensionsBase=%s', base => {
    const processed = { window: { width: 288, height: 512 }, screen: { width: 576, height: 1024 } }
    global.getDimensionsInfo = jest.fn(type => processed[type || base || 'window'])
    const expected = processed[base || 'window']
    expectVisualDimensions(expected)
    expectResizeDimensions(expected)
    expect(global.getDimensionsInfo.mock.calls.every(args => args.length === 0)).toBe(true)
  })

  it('reads initialized native-size values through the dimensions helper', () => {
    global.getDimensionsInfo = jest.fn(type => mockNativeDimensions[type || 'window'])
    expectVisualDimensions(mockNativeDimensions.window)
    expectResizeDimensions(mockNativeDimensions.window)
    expect(global.getDimensionsInfo.mock.calls.every(args => args.length === 0)).toBe(true)
  })

  it('initializes each sheet from the current dimensions and prefers its page layout', () => {
    global.getDimensionsInfo = jest.fn(() => ({ width: 288, height: 512 }))
    expectSheetDimensions({ width: 288, height: 512 })
    global.getDimensionsInfo.mockReturnValue({ width: 512, height: 288 })
    expectSheetDimensions({ width: 512, height: 288 })
    getFocusedNavigation().layout = { width: 480, height: 250 }
    expectSheetDimensions({ width: 480, height: 250 })
  })

  it('preserves page layout priority for views and viewport bounds', () => {
    global.getDimensionsInfo = jest.fn(() => ({ width: 576, height: 1024 }))
    getFocusedNavigation.mockReturnValue({ layout: { width: 250, height: 400, top: 30 } })
    expectVisualDimensions({ width: 250, height: 400 }, 30)
    expectResizeDimensions({ width: 576, height: 1024 })
  })
})
