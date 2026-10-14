import React from 'react'
import { act, create, ReactTestRenderer } from 'react-test-renderer'
import { setFocusedNavigation } from '@mpxjs/utils'
import Portal from '../../../lib/runtime/components/react/mpx-portal'
import { RouteContext } from '../../../lib/runtime/components/react/context'
import { showToast, hideToast, showLoading, hideLoading } from '../../../../api-proxy/src/platform/api/toast/rnToast'
import { showModal } from '../../../../api-proxy/src/platform/api/modal/rnModal'
import { showActionSheet } from '../../../../api-proxy/src/platform/api/action-sheet/rnActionSheet'

function mockReactNative () {
  return {
    View: 'View',
    Text: 'Text',
    Image: 'Image',
    ActivityIndicator: 'ActivityIndicator',
    TouchableOpacity: 'TouchableOpacity',
    ScrollView: 'ScrollView',
    TextInput: 'TextInput',
    StyleSheet: { create: (styles: any) => styles, hairlineWidth: 1 },
    Dimensions: { get: () => ({ width: 390, height: 844 }) }
  }
}

// 本包有 RN 依赖，api-proxy 将 RN 作为可选宿主依赖；两种解析路径使用同一 mock。
jest.mock(require.resolve('react-native'), () => mockReactNative())
jest.mock('react-native', () => mockReactNative(), { virtual: true })

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'AnimatedView' },
  useSharedValue: (value: any) => ({ value }),
  useAnimatedStyle: (fn: any) => fn(),
  withTiming: (value: any) => value,
  Easing: { inOut: jest.fn(), out: jest.fn(), poly: jest.fn() }
}), { virtual: true })

jest.mock('../../../../api-proxy/src/platform/api/system/rnSystem', () => ({
  getWindowInfo: () => ({ screenHeight: 844, safeArea: { bottom: 810 } })
}))

jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/index', () => require('../../../lib/runtime/components/react/mpx-portal'), { virtual: true })

describe('RN interaction APIs before page creation', () => {
  const renderers: ReactTestRenderer[] = []

  function mountPage (pageId = 1) {
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(
        <RouteContext.Provider value={{ pageId, navigation: {} }}>
          <Portal.Host id={pageId}>{null}</Portal.Host>
        </RouteContext.Provider>
      )
    })
    renderers.push(renderer!)
    return renderer!
  }

  const texts = (renderer: ReactTestRenderer) => renderer.root.findAllByType('Text').map(node => node.props.children)

  beforeEach(() => {
    jest.useFakeTimers()
    global.__mpxPagesMap = {}
    setFocusedNavigation(null)
  })

  afterEach(() => {
    act(() => hideToast())
    act(() => renderers.splice(0).forEach(renderer => renderer.unmount()))
    jest.clearAllTimers()
    jest.useRealTimers()
    setFocusedNavigation(null)
    delete global.__mpxPagesMap
  })

  it('shows a cached loading on the first page and lets that page hide it', () => {
    const success = jest.fn()
    showLoading({ title: 'Starting', success })
    expect(success).toHaveBeenCalledWith({ errMsg: 'showLoading:ok' })
    const first = mountPage()
    const second = mountPage(2)
    expect(texts(first)).toContain('Starting')
    expect(texts(second)).toEqual([])
    setFocusedNavigation({ pageId: 2, isFocused: () => true })
    act(() => hideLoading())
    expect(texts(first)).toContain('Starting')
    setFocusedNavigation({ pageId: 1, isFocused: () => true })
    act(() => hideLoading())
    expect(texts(first)).toEqual([])
  })

  it('cancels loading before the first page exists', () => {
    showLoading({ title: 'Cancelled' })
    hideLoading()
    expect(texts(mountPage())).toEqual([])
  })

  it('clears unassigned loading even when navigation exists before the host mounts', () => {
    showLoading({ title: 'Cancelled' })
    showModal({ title: 'Keep modal' })
    setFocusedNavigation({ pageId: 1, isFocused: () => true })
    hideLoading()
    const renderer = mountPage()
    expect(texts(renderer)).not.toContain('Cancelled')
    expect(texts(renderer)).toContain('Keep modal')
  })

  it('does not display a toast that expired before the first page mounted', () => {
    showToast({ title: 'Expired', duration: 10 })
    jest.advanceTimersByTime(10)
    expect(texts(mountPage())).toEqual([])
  })

  it('expires a startup toast after it has been bound to a page', () => {
    showToast({ title: 'Expires after binding', duration: 10 })
    const renderer = mountPage()
    expect(texts(renderer)).toContain('Expires after binding')
    act(() => jest.advanceTimersByTime(10))
    expect(texts(renderer)).toEqual([])
  })

  it('does not let an old page timeout cancel unassigned loading for the next page', () => {
    const first = mountPage()
    act(() => showToast({ title: 'Old page', duration: 10 }))
    act(() => first.unmount())
    showLoading({ title: 'Next page' })
    act(() => jest.advanceTimersByTime(10))
    expect(texts(mountPage(2))).toContain('Next page')
  })

  it('replaces unassigned content before the target host mounts', () => {
    showToast({ title: 'Old', duration: 10 })
    setFocusedNavigation({ pageId: 1, isFocused: () => true })
    showLoading({ title: 'New' })
    const renderer = mountPage()
    act(() => jest.advanceTimersByTime(10))
    expect(texts(renderer)).toEqual(['New'])
    act(() => hideLoading())
    expect(texts(renderer)).toEqual([])
  })

  it('replaces a startup toast from the receiving page', () => {
    showToast({ title: 'Old', duration: 10 })
    const renderer = mountPage()
    act(() => showLoading({ title: 'New' }))
    act(() => jest.advanceTimersByTime(10))
    expect(texts(renderer)).toEqual(['New'])
  })

  it('allows a cached modal to close with its normal callback', () => {
    const success = jest.fn()
    showModal({ title: 'Startup modal', showCancel: false, success })
    const renderer = mountPage()
    expect(texts(renderer)).toContain('Startup modal')
    act(() => renderer.root.findByType('TouchableOpacity').props.onPress())
    expect(success).toHaveBeenCalledWith(expect.objectContaining({ confirm: true }))
    expect(texts(renderer)).toEqual([])
  })

  it('closes stacked modals independently and calls their own callbacks', () => {
    const firstSuccess = jest.fn()
    const secondSuccess = jest.fn()
    const renderer = mountPage()
    act(() => showModal({ title: 'First modal', showCancel: false, success: firstSuccess }))
    act(() => showModal({ title: 'Second modal', showCancel: false, success: secondSuccess }))
    act(() => renderer.root.findAllByType('TouchableOpacity')[1].props.onPress())
    expect(texts(renderer)).toContain('First modal')
    expect(texts(renderer)).not.toContain('Second modal')
    expect(secondSuccess).toHaveBeenCalledTimes(1)
    expect(firstSuccess).not.toHaveBeenCalled()
    act(() => renderer.root.findByType('TouchableOpacity').props.onPress())
    expect(firstSuccess).toHaveBeenCalledTimes(1)
    expect(texts(renderer)).toEqual([])
  })

  it.each([true, false])('stacks action sheets and closes each independently (both cached: %s)', (bothCached) => {
    const cancelFirst = jest.fn()
    const success = jest.fn()
    showActionSheet({ itemList: ['Old'], fail: cancelFirst })
    if (bothCached) showActionSheet({ itemList: ['New'], success })
    const renderer = mountPage()
    if (!bothCached) act(() => showActionSheet({ itemList: ['New'], success }))
    expect(texts(renderer)).toContain('Old')
    expect(texts(renderer)).toContain('New')
    act(() => renderer.root.findAllByType('Text').find(node => node.props.children === 'New')!.parent!.props.onTouchEnd())
    expect(success).toHaveBeenCalledWith({ errMsg: 'showActionSheet:ok', tapIndex: 0 })
    expect(cancelFirst).not.toHaveBeenCalled()
    expect(texts(renderer)).toContain('Old')
    expect(texts(renderer)).not.toContain('New')
    act(() => renderer.root.findAllByType('Text').find(node => node.props.children === '取消')!.parent!.props.onTouchEnd())
    expect(cancelFirst).toHaveBeenCalledWith({ errMsg: 'showActionSheet:fail cancel' })
    expect(success).toHaveBeenCalledTimes(1)
    expect(texts(renderer)).toEqual([])
  })

  it('closes a startup action sheet after binding it to the first page', () => {
    const success = jest.fn()
    showActionSheet({ itemList: ['Startup'], success })
    const renderer = mountPage()
    act(() => renderer.root.findAllByType('Text').find(node => node.props.children === 'Startup')!.parent!.props.onTouchEnd())
    expect(success).toHaveBeenCalledWith({ errMsg: 'showActionSheet:ok', tapIndex: 0 })
    expect(texts(renderer)).toEqual([])
  })

  it('closes the originating action sheet when focus has moved to another page', () => {
    showActionSheet({ itemList: ['First action'] })
    const first = mountPage()
    const selectFirst = first.root.findAllByType('Text').find(node => node.props.children === 'First action')!.parent!.props.onTouchEnd
    const second = mountPage(2)
    setFocusedNavigation({ pageId: 2, isFocused: () => true })
    act(() => showActionSheet({ itemList: ['Second action'] }))
    act(() => selectFirst())
    expect(texts(first)).toEqual([])
    expect(texts(second)).toContain('Second action')
  })
})
