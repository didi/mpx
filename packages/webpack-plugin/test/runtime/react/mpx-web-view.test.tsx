/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { getWebViews, renderWithPortalHost, resetMpxRuntimeGlobals } from './rn-component-test-utils'

const mockNavigateTo = jest.fn(() => Promise.resolve({ errMsg: 'navigateTo:ok' }))
const mockNavigateBack = jest.fn(() => Promise.resolve({ errMsg: 'navigateBack:ok' }))
const mockRedirectTo = jest.fn(() => Promise.resolve({ errMsg: 'redirectTo:ok' }))
const mockReLaunch = jest.fn(() => Promise.resolve({ errMsg: 'reLaunch:ok' }))
const mockSwitchTab = jest.fn(() => Promise.resolve({ errMsg: 'switchTab:ok' }))

jest.mock('@mpxjs/api-proxy', () => ({
  promisify: jest.fn((apis) => apis),
  navigateTo: mockNavigateTo,
  navigateBack: mockNavigateBack,
  redirectTo: mockRedirectTo,
  reLaunch: mockReLaunch,
  switchTab: mockSwitchTab
}))

const mockPreventRemoveState: { enabled?: boolean, callback?: Function } = {}
jest.mock('@react-navigation/native', () => ({
  usePreventRemove: jest.fn((enabled, callback) => {
    mockPreventRemoveState.enabled = enabled
    mockPreventRemoveState.callback = callback
  })
}), { virtual: true })

const mockWebViewInstances: any[] = []
jest.mock('react-native-webview', () => {
  const mockReact = require('react')
  const MockWebView = mockReact.forwardRef((props: any, ref: any) => {
    const instanceRef = mockReact.useRef({
      goBack: jest.fn(),
      injectJavaScript: jest.fn(),
      postMessage: jest.fn(),
      reload: jest.fn()
    })
    mockReact.useImperativeHandle(ref, () => instanceRef.current)
    mockReact.useEffect(() => {
      mockWebViewInstances.push(instanceRef.current)
    }, [])
    return mockReact.createElement('WebView', Object.assign({ testID: props.testID || 'mock-webview' }, props))
  })
  return {
    __esModule: true,
    WebView: MockWebView,
    default: MockWebView
  }
})

const MpxWebView = require('../../../lib/runtime/components/react/mpx-web-view').default

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
  mockWebViewInstances.length = 0
})

describe('MpxWebView', () => {
  it('validates hosts, handles navigation, messages and load events', async () => {
    const customApi = (global as any).__mpx.config.rnConfig.webviewConfig.apiImplementations.customApi
    const navigation = {
      setPageConfig: jest.fn(),
      dispatch: jest.fn(),
      getState: jest.fn(() => ({ routes: [{ name: 'index' }, { name: 'web' }] }))
    }
    const bindmessage = jest.fn()
    const bindload = jest.fn()
    const binderror = jest.fn()

    renderWithPortalHost(
      <MpxWebView
        src="https://m.example.com/page"
        bindmessage={bindmessage}
        bindload={bindload}
        binderror={binderror}
      />,
      navigation
    )

    const webView = getWebViews()[0]
    fireEvent(webView, 'navigationStateChange', {
      navigationType: 'click',
      url: 'https://m.example.com/next',
      canGoBack: true
    })
    expect((global as any).__mockPage.__webViewUrl).toBe('https://m.example.com/next')
    expect(mockPreventRemoveState.enabled).toBe(true)

    fireEvent(webView, 'message', {
      nativeEvent: {
        url: 'https://m.example.com/page',
        data: JSON.stringify({
          type: 'setTitle',
          payload: { _documentTitle: ' New title ' }
        })
      }
    })
    expect(navigation.setPageConfig).toHaveBeenCalledWith({ navigationBarTitleText: 'New title' })

    fireEvent(webView, 'message', {
      nativeEvent: {
        url: 'https://m.example.com/page',
        data: JSON.stringify({
          type: 'postMessage',
          payload: { data: ['hello'] },
          callbackId: 1
        })
      }
    })
    expect(bindmessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'message',
      detail: { data: ['hello'] }
    }))

    fireEvent(webView, 'message', {
      nativeEvent: {
        url: 'https://m.example.com/page',
        data: JSON.stringify({
          type: 'customApi',
          payload: { count: 1 },
          callbackId: 2
        })
      }
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(customApi).toHaveBeenCalledWith({ count: 1 })
    expect(mockWebViewInstances[0].injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining('"type":"customApi","callbackId":2,"result":{"ok":true}')
    )

    fireEvent(webView, 'httpError', { nativeEvent: { statusCode: 500 } })
    fireEvent(webView, 'loadEnd', { timeStamp: 1, nativeEvent: { url: 'https://m.example.com/page' } })
    expect(binderror).toHaveBeenCalledWith(expect.objectContaining({
      detail: { src: 'https://m.example.com/page', statusCode: 500 }
    }))

    fireEvent(webView, 'loadEnd', { timeStamp: 2, nativeEvent: { url: 'https://m.example.com/page' } })
    expect(bindload).toHaveBeenCalledWith(expect.objectContaining({
      detail: { src: 'https://m.example.com/page' }
    }))

    act(() => {
      mockPreventRemoveState.callback?.({ data: { action: { type: 'GO_BACK' } } })
    })
    expect(mockWebViewInstances[0].goBack).toHaveBeenCalled()
  })

  it('bridges navigation APIs, rejects missing implementations and ignores blocked messages', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const customApi = (global as any).__mpx.config.rnConfig.webviewConfig.apiImplementations.customApi
    const navigation = {
      setPageConfig: jest.fn(),
      dispatch: jest.fn(),
      getState: jest.fn(() => ({ routes: [{ name: 'index' }, { name: 'web' }] }))
    }
    renderWithPortalHost(<MpxWebView src="https://m.example.com/page" style={{ width: 100 }} />, navigation)
    const webView = getWebViews()[0]

    const emitMessage = (type: string, callbackId: number, payload = {}) => {
      fireEvent(webView, 'message', {
        nativeEvent: {
          url: 'https://m.example.com/page',
          data: JSON.stringify({ type, payload, callbackId })
        }
      })
    }

    emitMessage('navigateTo', 1, { url: '/pages/a' })
    emitMessage('navigateBack', 2, { delta: 1 })
    emitMessage('redirectTo', 3, { url: '/pages/b' })
    emitMessage('switchTab', 4, { url: '/pages/tab' })
    emitMessage('reLaunch', 5, { url: '/pages/home' })
    emitMessage('missingApi', 6, { value: 1 })
    fireEvent(webView, 'message', {
      nativeEvent: {
        url: 'https://blocked.test/page',
        data: JSON.stringify({ type: 'customApi', payload: { blocked: true }, callbackId: 7 })
      }
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(mockNavigateTo).toHaveBeenCalledWith({ url: '/pages/a' })
    expect(mockNavigateBack).toHaveBeenCalledWith({ delta: 1 })
    expect(mockRedirectTo).toHaveBeenCalledWith({ url: '/pages/b' })
    expect(mockSwitchTab).toHaveBeenCalledWith({ url: '/pages/tab' })
    expect(mockReLaunch).toHaveBeenCalledWith({ url: '/pages/home' })
    expect(mockWebViewInstances[0].injectJavaScript).toHaveBeenCalledWith(expect.stringContaining('missingApi'))
    expect(customApi).not.toHaveBeenCalled()

    act(() => {
      mockPreventRemoveState.callback?.({ data: { action: { type: 'GO_BACK' } } })
    })
    expect(navigation.dispatch).toHaveBeenCalledWith({ type: 'GO_BACK' })
    warnSpy.mockRestore()
  })

  it('renders empty for missing or disallowed src and reloads initial load errors', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const emptyRender = renderWithPortalHost(<MpxWebView src="" />)
    expect(emptyRender.queryByTestId('mock-webview')).toBeNull()
    emptyRender.unmount()

    const blockedRender = renderWithPortalHost(<MpxWebView src="https://blocked.test/page" />)
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('domainWhiteLists'))
    blockedRender.unmount()

    renderWithPortalHost(<MpxWebView src="https://m.example.com/fail" />)
    act(() => {
      fireEvent(getWebViews()[0], 'error')
    })
    expect(screen.getByText('网络不可用，请检查网络设置')).toBeTruthy()
    fireEvent(screen.getByText('重新加载').parent, 'touchEnd')
    expect(screen.getByTestId('mock-webview')).toBeTruthy()
    errorSpy.mockRestore()
  })

  it('handles non-iOS load progress, deferred loadEnd, reload and empty whitelist', () => {
    jest.useFakeTimers()
    ;(global as any).__mpx_mode__ = 'android'
    ;(global as any).__mpx.config.rnConfig.webviewConfig.hostWhitelists = []
    const bindload = jest.fn()

    const loadRender = renderWithPortalHost(<MpxWebView src="https://blocked.test/page" bindload={bindload} />)
    const webView = getWebViews()[0]
    fireEvent(webView, 'loadProgress', { nativeEvent: { canGoBack: true } })
    fireEvent(webView, 'loadEnd', {
      persist: jest.fn(),
      timeStamp: 3,
      nativeEvent: { url: 'https://blocked.test/page' }
    })
    act(() => {
      jest.advanceTimersByTime(0)
    })
    expect(bindload).toHaveBeenCalledWith(expect.objectContaining({
      detail: { src: 'https://blocked.test/page' }
    }))
    loadRender.unmount()

    renderWithPortalHost(<MpxWebView src="https://blocked.test/reload" />)
    act(() => {
      fireEvent(getWebViews()[0], 'error')
    })
    fireEvent(screen.getByText('重新加载').parent, 'touchEnd')
    expect(screen.getByTestId('mock-webview')).toBeTruthy()
    jest.useRealTimers()
  })

  it('handles malformed messages, args payloads and loaded-page errors', async () => {
    (global as any).__mpx.config.rnConfig.webviewConfig.hostWhitelists = []
    const customApi = (global as any).__mpx.config.rnConfig.webviewConfig.apiImplementations.customApi
    const navigation = {
      setPageConfig: jest.fn(),
      dispatch: jest.fn(),
      getState: jest.fn(() => ({ routes: [{ name: 'index' }, { name: 'web' }] }))
    }

    renderWithPortalHost(<MpxWebView src="notaurl" bindload={jest.fn()} />, navigation)
    const webView = getWebViews()[0]
    fireEvent(webView, 'navigationStateChange', {
      url: 'notaurl',
      canGoBack: false
    })
    fireEvent(webView, 'message', {
      nativeEvent: {
        url: 'notaurl',
        data: { invalid: true }
      }
    })
    fireEvent(webView, 'message', {
      nativeEvent: {
        url: 'notaurl',
        data: '{bad json'
      }
    })
    fireEvent(webView, 'message', {
      nativeEvent: {
        url: 'notaurl',
        data: JSON.stringify({
          type: 'setTitle',
          payload: {}
        })
      }
    })
    fireEvent(webView, 'message', {
      nativeEvent: {
        url: 'notaurl',
        data: JSON.stringify({
          type: 'customApi',
          args: [{ count: 2 }],
          callbackId: 8
        })
      }
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(navigation.setPageConfig).not.toHaveBeenCalled()
    expect(customApi).toHaveBeenCalledWith({ count: 2 })
    expect(mockWebViewInstances[0].injectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining('"type":"customApi","callbackId":8,"result":{"ok":true}')
    )

    fireEvent(webView, 'loadEnd', { timeStamp: 4, nativeEvent: { url: 'notaurl' } })
    fireEvent(webView, 'error')
    expect(screen.queryByText('网络不可用，请检查网络设置')).toBeNull()
  })
})
