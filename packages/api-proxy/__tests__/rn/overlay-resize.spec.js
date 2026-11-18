let mockDimensions
let mockNavigation
let mockFocusedNavigation
let mockPageId = 0
let mockInsets
const mockRenderers = new Map()
let mockPortalKey = 0

jest.mock('react-native', () => ({
  Dimensions: { addEventListener: jest.fn() },
  StyleSheet: { create: styles => styles, hairlineWidth: 0.5 },
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  ActivityIndicator: 'ActivityIndicator',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  TextInput: 'TextInput'
}), { virtual: true })
jest.mock('react-native-safe-area-context', () => {
  const React = require('react')
  const Context = React.createContext({ top: 0, bottom: 0, left: 0, right: 0 })
  return { Context, useSafeAreaInsets: () => React.useContext(Context) }
}, { virtual: true })
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'AnimatedView' },
  useSharedValue: value => require('react').useRef({ value }).current,
  useAnimatedStyle: callback => callback(),
  withTiming: jest.fn(value => value),
  Easing: { inOut: value => value, out: value => value, poly: value => value }
}), { virtual: true })
jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/context', () => ({
  RouteContext: require('react').createContext()
}), { virtual: true })
jest.mock('../../src/common/js', () => ({
  getFocusedNavigation: () => mockFocusedNavigation,
  getCurrentPageId: () => mockPageId,
  successHandle: (result, success, complete) => { success?.(result); complete?.(result) },
  failHandle: jest.fn()
}))
jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/index', () => ({
  getPageId: () => mockPageId,
  add: jest.fn(() => ++mockPortalKey),
  remove: jest.fn(key => {
    mockRenderers.get(key)?.unmount()
    mockRenderers.delete(key)
  })
}), { virtual: true })

const React = require('react')
const { Dimensions } = require('react-native')
const { act, create } = require('react-test-renderer')
const { RouteContext } = require('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/context')
const { Context: SafeAreaContext } = require('react-native-safe-area-context')
const portal = require('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/index')
const { withTiming } = require('react-native-reanimated')
const { showActionSheet } = require('../../src/platform/api/action-sheet/rnActionSheet')
const { showToast, showLoading, hideToast, hideLoading } = require('../../src/platform/api/toast/rnToast')
const { showModal } = require('../../src/platform/api/modal/rnModal')
const { onWindowResize, offWindowResize } = require('../../src/platform/api/window/rnWindow')

function wrap (element) {
  return React.createElement(RouteContext.Provider, { value: { navigation: mockNavigation } },
    React.createElement(SafeAreaContext.Provider, { value: mockInsets }, element))
}

function showAndMount (show, options) {
  act(() => show(options))
  const last = portal.add.mock.calls.length - 1
  const element = portal.add.mock.calls[last][0]
  const key = portal.add.mock.results[last].value
  let renderer
  act(() => { renderer = create(wrap(element)) })
  mockRenderers.set(key, renderer)
  return { renderer, element, key }
}

function rootStyle (renderer) {
  return Object.assign({}, ...[].concat(renderer.root.findAllByType('View')[0].props.style))
}

function expectParentLayout (renderer) {
  const style = rootStyle(renderer)
  expect(style).toMatchObject({ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 })
  expect(style.width).toBeUndefined()
  expect(style.height).toBeUndefined()
}

function stylesIn (renderer) {
  return renderer.root.findAll(node => typeof node.type === 'string').flatMap(node => [].concat(node.props.style || []))
}

async function rotate () {
  mockDimensions = { width: 640, height: 360 }
  mockNavigation.layout = { width: 600, height: 296 }
  await act(async () => {
    global.__mpxWindowResizeHandler?.(mockDimensions)
  })
}

describe('visible RN overlays resize in place', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    mockPageId++
    mockDimensions = { width: 360, height: 640 }
    mockNavigation = { layout: { width: 320, height: 576 } }
    mockFocusedNavigation = mockNavigation
    mockInsets = { top: 20, bottom: 10, left: 0, right: 0 }
    global.getDimensionsInfo = jest.fn(() => Object.assign({}, mockDimensions))
  })

  afterEach(() => {
    act(() => hideToast())
    act(() => mockRenderers.forEach(renderer => renderer.unmount()))
    mockRenderers.clear()
    jest.clearAllTimers()
    jest.useRealTimers()
    delete global.getDimensionsInfo
    expect(global.__mpxWindowResizeHandler).toBeUndefined()
  })

  it.each([
    ['Toast', showToast, { title: 'message', icon: 'none' }],
    ['Loading', showLoading, { title: 'loading' }],
    ['ActionSheet', showActionSheet, { itemList: ['first'] }],
    ['Modal', showModal, { title: 'message' }]
  ])('keeps %s stretched to its parent across layout changes', async (name, show, options) => {
    const { renderer } = showAndMount(show, options)
    expectParentLayout(renderer)
    expect(global.__mpxPageSizeCountMap).toBeUndefined()
    expect(global.__mpxSizeCount).toBeUndefined()
    await rotate()
    expectParentLayout(renderer)
  })

  it.each([
    ['Toast', showToast, { title: 'message', icon: 'none' }],
    ['Loading', showLoading, { title: 'loading' }]
  ])('stores only the configured base height used by %s', async (name, show, options) => {
    global.getDimensionsInfo = jest.fn(base => base === undefined ? Object.assign({}, mockDimensions) : { width: 720, height: 1280 })
    const { renderer } = showAndMount(show, options)
    expectParentLayout(renderer)
    expect(stylesIn(renderer)).toContainEqual({ marginTop: 256 })
    const initialStyle = renderer.root.findAllByType('View')[1].props.style
    await act(async () => { global.__mpxWindowResizeHandler({ width: 720, height: 1280 }) })
    expect(renderer.root.findAllByType('View')[1].props.style).toBe(initialStyle)
    mockDimensions = { width: 600, height: 640 }
    await act(async () => { global.__mpxWindowResizeHandler({ width: 1200, height: 1280 }) })
    expect(renderer.root.findAllByType('View')[1].props.style).toBe(initialStyle)
    mockDimensions = { width: 600, height: 296 }
    await act(async () => { global.__mpxWindowResizeHandler({ width: 1200, height: 592 }) })
    expect(stylesIn(renderer)).toContainEqual({ marginTop: 118 })
    expectParentLayout(renderer)
    const resizedStyle = renderer.root.findAllByType('View')[1].props.style
    await act(async () => { global.__mpxWindowResizeHandler({ width: 1200, height: 592 }) })
    expect(renderer.root.findAllByType('View')[1].props.style).toBe(resizedStyle)
    expect(global.getDimensionsInfo.mock.calls.every(args => args.length === 0)).toBe(true)
  })

  it('refreshes Modal from configured base dimensions on resize', async () => {
    global.getDimensionsInfo = jest.fn(base => base === undefined ? Object.assign({}, mockDimensions) : { width: 720, height: 1280 })
    const { renderer } = showAndMount(showModal, { title: 'message', content: 'text' })
    expectParentLayout(renderer)
    expect(stylesIn(renderer)).toContainEqual({ width: 288 })
    expect(stylesIn(renderer)).toContainEqual({ maxHeight: 640 * 0.45 })
    mockDimensions = { width: 600, height: 640 }
    await act(async () => { global.__mpxWindowResizeHandler({ width: 1200, height: 1280 }) })
    expect(stylesIn(renderer)).toContainEqual({ width: 480 })
    expect(stylesIn(renderer)).toContainEqual({ maxHeight: 640 * 0.45 })
    mockDimensions = { width: 600, height: 296 }
    await act(async () => { global.__mpxWindowResizeHandler({ width: 1200, height: 592 }) })
    expect(stylesIn(renderer)).toContainEqual({ width: 480 })
    expect(stylesIn(renderer)).toContainEqual({ maxHeight: 296 * 0.45 })
    expect(global.getDimensionsInfo.mock.calls.every(args => args.length === 0)).toBe(true)
  })

  it('keeps ActionSheet edge positioning and updates safe-area padding', async () => {
    const { renderer, element } = showAndMount(showActionSheet, { itemList: ['first', 'second'] })
    expectParentLayout(renderer)
    expect(Dimensions.addEventListener).not.toHaveBeenCalled()
    expect(global.__mpxWindowResizeHandler).toBeUndefined()
    expect(withTiming).toHaveBeenCalledTimes(2)
    await rotate()
    expectParentLayout(renderer)
    expect(stylesIn(renderer)).toContainEqual(expect.objectContaining({ bottom: 0, left: 0, right: 0 }))
    mockInsets = { top: 0, bottom: 0, left: 0, right: 0 }
    act(() => renderer.update(wrap(element)))
    expect(stylesIn(renderer)).toContainEqual({ paddingBottom: 10 })
    expect(global.getDimensionsInfo).not.toHaveBeenCalled()
    expect(Dimensions.addEventListener).not.toHaveBeenCalled()
    expect(global.__mpxWindowResizeHandler).toBeUndefined()
    expect(withTiming).toHaveBeenCalledTimes(2)
    expect(portal.add).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['Toast', showToast, { title: 'message', icon: 'none', duration: 5000 }],
    ['Loading', showLoading, { title: 'loading' }]
  ])('repositions an existing %s using the new base height', async (name, show, options) => {
    const { renderer } = showAndMount(show, options)
    expectParentLayout(renderer)
    expect(stylesIn(renderer)).toContainEqual({ marginTop: 256 })
    await rotate()
    expectParentLayout(renderer)
    expect(stylesIn(renderer)).toContainEqual({ marginTop: 144 })
    expect(portal.add).toHaveBeenCalledTimes(1)
  })

  it('keeps the original Toast expiry time after rotation', async () => {
    const { key } = showAndMount(showToast, { title: 'message', icon: 'none', duration: 1500 })
    act(() => jest.advanceTimersByTime(1000))
    await rotate()
    act(() => jest.advanceTimersByTime(499))
    expect(portal.remove).not.toHaveBeenCalled()
    act(() => jest.advanceTimersByTime(1))
    expect(portal.remove).toHaveBeenCalledWith(key)
    expect(global.__mpxWindowResizeHandler).toBeUndefined()
  })

  it('resizes an open Modal while retaining entered text and its callback', async () => {
    const success = jest.fn()
    const { renderer } = showAndMount(showModal, { title: 'edit', editable: true, content: 'initial', success })
    const input = renderer.root.findByType('TextInput')
    act(() => input.props.onChangeText('typed before rotation'))
    await rotate()
    expectParentLayout(renderer)
    expect(stylesIn(renderer)).toContainEqual({ width: 512 })
    expect(renderer.root.findByType('TextInput')).toBe(input)
    act(() => renderer.root.findAllByType('TouchableOpacity')[1].props.onPress())
    expect(success).toHaveBeenCalledWith(expect.objectContaining({ confirm: true, content: 'typed before rotation' }))
    expect(portal.add).toHaveBeenCalledTimes(1)
  })

  it('updates Modal scroll limits after rotation', async () => {
    const { renderer } = showAndMount(showModal, { title: 'text', content: 'long content' })
    await rotate()
    expect(stylesIn(renderer)).toContainEqual({ maxHeight: 360 * 0.45 })
  })

  it('uses the configured base height with owning and focused page layouts', async () => {
    const { renderer } = showAndMount(showToast, { title: 'message', icon: 'none' })
    mockFocusedNavigation = { layout: { width: 999, height: 999 } }
    await rotate()
    expectParentLayout(renderer)
    expect(stylesIn(renderer)).toContainEqual({ marginTop: 144 })
  })

  it.each([
    ['Toast', showToast, hideToast],
    ['Loading', showLoading, hideLoading]
  ])('unsubscribes a hidden %s without removing a business listener', async (name, show, hide) => {
    const businessListener = jest.fn()
    onWindowResize(businessListener)
    showAndMount(show, { title: 'message' })
    act(() => hide())
    act(() => global.__mpxWindowResizeHandler({ width: 500, height: 700 }))
    expect(businessListener).toHaveBeenCalledTimes(1)
    offWindowResize(businessListener)
  })

  it('removes the Modal resize subscription on unmount', () => {
    const { key } = showAndMount(showModal, { title: 'message' })
    act(() => portal.remove(key))
    expect(global.__mpxWindowResizeHandler).toBeUndefined()
  })
})
