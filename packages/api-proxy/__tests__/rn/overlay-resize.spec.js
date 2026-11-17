let mockDimensions
let mockNavigation
let mockFocusedNavigation
let mockPageId = 0
let mockInsets
const mockRenderers = new Map()
let mockPortalKey = 0

jest.mock('react-native', () => ({
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
  return { Context, useSafeAreaInsets: jest.fn(() => React.useContext(Context)) }
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
  add: jest.fn(() => ++mockPortalKey),
  remove: jest.fn(key => {
    mockRenderers.get(key)?.unmount()
    mockRenderers.delete(key)
  })
}), { virtual: true })

const React = require('react')
const { act, create } = require('react-test-renderer')
const { RouteContext } = require('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/context')
const { Context: SafeAreaContext, useSafeAreaInsets } = require('react-native-safe-area-context')
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
  expect(style).toMatchObject({ left: 0, right: 0, top: 0, bottom: 0 })
  expect(style.width).toBeUndefined()
  expect(style.height).toBeUndefined()
}

function stylesIn (renderer) {
  return renderer.root.findAll(node => typeof node.type === 'string').flatMap(node => [].concat(node.props.style || []))
}

async function rotate () {
  mockDimensions = { width: 640, height: 360 }
  mockNavigation.layout = { width: 600, height: 296 }
  await act(async () => { global.__mpxWindowResizeHandler(mockDimensions) })
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
    global.getDimensionsInfo = () => mockDimensions
  })

  afterEach(() => {
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
    expect(global.__mpxWindowResizeHandler).toEqual(expect.any(Function))
    expectParentLayout(renderer)
    expect(global.__mpxPageSizeCountMap).toBeUndefined()
    expect(global.__mpxSizeCount).toBeUndefined()
    await rotate()
    expectParentLayout(renderer)
  })

  it.each([
    ['Toast', showToast, { title: 'message', icon: 'none' }, size => ({ marginTop: parseInt(size.height * 0.4) })],
    ['Loading', showLoading, { title: 'loading' }, size => ({ marginTop: parseInt(size.height * 0.4) })],
    ['Modal', showModal, { title: 'message' }, size => ({ width: size.width * 0.8 })]
  ])('uses event dimensions for %s content and skips duplicate sizes', async (name, show, options, contentStyle) => {
    mockNavigation.layout = undefined
    const { renderer } = showAndMount(show, options)
    expectParentLayout(renderer)
    expect(stylesIn(renderer)).toContainEqual(contentStyle({ width: 360, height: 640 }))
    const initialStyle = renderer.root.findAllByType('View')[1].props.style
    await act(async () => { global.__mpxWindowResizeHandler({ width: 360, height: 640 }) })
    expect(renderer.root.findAllByType('View')[1].props.style).toBe(initialStyle)
    // Keep the getter unchanged to verify dimensions come from the event.
    await act(async () => { global.__mpxWindowResizeHandler({ width: 600, height: 640 }) })
    expect(stylesIn(renderer)).toContainEqual(contentStyle({ width: 600, height: 640 }))
    await act(async () => { global.__mpxWindowResizeHandler({ width: 600, height: 296 }) })
    expect(stylesIn(renderer)).toContainEqual(contentStyle({ width: 600, height: 296 }))
    expectParentLayout(renderer)
    const resizedStyle = renderer.root.findAllByType('View')[1].props.style
    await act(async () => { global.__mpxWindowResizeHandler({ width: 600, height: 296 }) })
    expect(renderer.root.findAllByType('View')[1].props.style).toBe(resizedStyle)
  })

  it('keeps an open ActionSheet synchronized on resize without replaying its entrance animation', async () => {
    const { renderer, element } = showAndMount(showActionSheet, { itemList: ['first', 'second'] })
    expectParentLayout(renderer)
    expect(global.__mpxWindowResizeHandler).toEqual(expect.any(Function))
    expect(withTiming).toHaveBeenCalledTimes(2)
    const initialRenders = useSafeAreaInsets.mock.calls.length
    await rotate()
    expect(useSafeAreaInsets).toHaveBeenCalledTimes(initialRenders + 1)
    expectParentLayout(renderer)
    expect(stylesIn(renderer)).toContainEqual(expect.objectContaining({ bottom: 0, left: 0, right: 0 }))
    mockInsets = { top: 0, bottom: 0, left: 0, right: 0 }
    act(() => renderer.update(wrap(element)))
    expect(stylesIn(renderer)).toContainEqual({ paddingBottom: 10 })
    expect(global.__mpxWindowResizeHandler).toEqual(expect.any(Function))
    expect(withTiming).toHaveBeenCalledTimes(2)
    expect(portal.add).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['Toast', showToast, { title: 'message', icon: 'none', duration: 5000 }],
    ['Loading', showLoading, { title: 'loading' }]
  ])('repositions an existing %s using the new page dimensions', async (name, show, options) => {
    const { renderer } = showAndMount(show, options)
    expectParentLayout(renderer)
    expect(stylesIn(renderer)).toContainEqual({ marginTop: 230 })
    await rotate()
    expectParentLayout(renderer)
    expect(stylesIn(renderer)).toContainEqual({ marginTop: 118 })
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
    expect(stylesIn(renderer)).toContainEqual({ width: 480 })
    expect(renderer.root.findByType('TextInput')).toBe(input)
    act(() => renderer.root.findAllByType('TouchableOpacity')[1].props.onPress())
    expect(success).toHaveBeenCalledWith(expect.objectContaining({ confirm: true, content: 'typed before rotation' }))
    expect(portal.add).toHaveBeenCalledTimes(1)
  })

  it('updates Modal scroll limits after rotation', async () => {
    const { renderer } = showAndMount(showModal, { title: 'text', content: 'long content' })
    await rotate()
    expect(stylesIn(renderer)).toContainEqual({ maxHeight: 296 * 0.45 })
  })

  it('uses the owning page instead of a different focused page', async () => {
    const { renderer } = showAndMount(showToast, { title: 'message', icon: 'none' })
    mockFocusedNavigation = { layout: { width: 999, height: 999 } }
    await rotate()
    expectParentLayout(renderer)
    expect(stylesIn(renderer)).toContainEqual({ marginTop: 118 })
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

  it.each([
    ['ActionSheet', showActionSheet, { itemList: ['first'] }],
    ['Modal', showModal, { title: 'message' }]
  ])('removes the resize subscription after %s unmounts', async (name, show, options) => {
    const { key } = showAndMount(show, options)
    act(() => portal.remove(key))
    expect(global.__mpxWindowResizeHandler).toBeUndefined()
  })
})
