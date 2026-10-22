let mockWindow = { width: 360, height: 640 }
const mockScreen = { width: 720, height: 1280 }

jest.mock('react-native', () => ({
  Dimensions: { get: type => type === 'window' ? mockWindow : mockScreen },
  PixelRatio: { get: () => 2 },
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
jest.mock('@mpxjs/core', () => ({ config: { rnConfig: {} } }))
jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: { insets: { top: 20, bottom: 10, left: 0, right: 0 } }
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

function stylesIn (node) {
  if (!node || !node.props) return []
  const styles = node.props.style ? [].concat(node.props.style) : []
  return styles.concat([].concat(node.props.children || []).flatMap(stylesIn))
}

describe('RN window adaptation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockWindow = { width: 360, height: 640 }
    global.__mpx_mode__ = 'ios'
    delete global.getDimensionsInfo
    require('@mpxjs/core').config.rnConfig = {}
    require('../../src/common/js').getFocusedNavigation.mockReturnValue({})
  })
  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    delete global.getDimensionsInfo
  })

  it('uses the iOS window for window and safe-area fields, retaining physical screen fields', () => {
    const { getWindowInfo } = require('../../src/platform/api/system/rnSystem')
    const info = getWindowInfo()
    expect(info).toMatchObject({ screenWidth: 720, screenHeight: 1280, windowWidth: 360, windowHeight: 640 })
    expect(info.safeArea).toMatchObject({ right: 360, bottom: 630, width: 360, height: 610 })
  })

  it('keeps processed Dimensions and re-reads customLayout, while page layout takes priority', () => {
    const { getWindowInfo } = require('../../src/platform/api/system/rnSystem')
    global.getDimensionsInfo = type => type === 'window' ? { width: 320, height: 600 } : mockScreen
    expect(getWindowInfo().windowWidth).toBe(320)
    const customLayout = jest.fn(() => ({ width: 300, height: 500 }))
    require('@mpxjs/core').config.rnConfig.customLayout = customLayout
    expect(getWindowInfo()).toMatchObject({ windowWidth: 300, windowHeight: 500 })
    customLayout.mockReturnValue({ width: 280, height: 450 })
    expect(getWindowInfo()).toMatchObject({ windowWidth: 280, windowHeight: 450 })
    require('../../src/common/js').getFocusedNavigation.mockReturnValue({ layout: { width: 250, height: 400 } })
    expect(getWindowInfo()).toMatchObject({ windowWidth: 250, windowHeight: 400 })
    require('@mpxjs/core').config.rnConfig.customLayout = () => ({ width: 0 })
    require('../../src/common/js').getFocusedNavigation.mockReturnValue({})
    expect(getWindowInfo().windowWidth).toBe(320)
  })

  it('preserves the Android screen fallback', () => {
    global.__mpx_mode__ = 'android'
    const { getWindowInfo } = require('../../src/platform/api/system/rnSystem')
    expect(getWindowInfo()).toMatchObject({ windowWidth: 720, windowHeight: 1280 })
  })

  it('positions the iOS menu button using window width', () => {
    const { getMenuButtonBoundingClientRect } = require('../../src/platform/api/setting/index.ios')
    expect(getMenuButtonBoundingClientRect().right).toBe(353)
    mockWindow = { width: 640, height: 360 }
    expect(getMenuButtonBoundingClientRect().right).toBe(633)
  })

  it('reads the latest window size when showing another modal', () => {
    const { showModal } = require('../../src/platform/api/modal/rnModal')
    const portal = require('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/index')
    showModal({ title: 'first' })
    expect(stylesIn(portal.add.mock.calls[0][0])).toContainEqual(expect.objectContaining({ width: 288 }))
    mockWindow = { width: 640, height: 360 }
    showModal({ title: 'rotated' })
    expect(stylesIn(portal.add.mock.calls[1][0])).toContainEqual(expect.objectContaining({ width: 512 }))
  })

  it('positions each iOS toast using the current window height', () => {
    const { showToast } = require('../../src/platform/api/toast/rnToast')
    const portal = require('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/index')
    showToast({ title: 'first', icon: 'none' })
    expect(stylesIn(portal.add.mock.calls[0][0])).toContainEqual(expect.objectContaining({ marginTop: 256 }))
    mockWindow = { width: 640, height: 360 }
    showToast({ title: 'rotated', icon: 'none' })
    expect(stylesIn(portal.add.mock.calls[1][0])).toContainEqual(expect.objectContaining({ marginTop: 144 }))
  })
})
