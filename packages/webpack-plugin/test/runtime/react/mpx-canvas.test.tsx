/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, fireEvent, render } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { expectPortalHostRendered, getWebViews, renderWithPortalHost, resetMpxRuntimeGlobals } from './rn-component-test-utils'

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
    return mockReact.createElement('WebView', Object.assign({ testID: props.testID || 'mock-webview' }, props))
  })
  return {
    __esModule: true,
    WebView: MockWebView,
    default: MockWebView
  }
})

const MpxCanvas = require('../../../lib/runtime/components/react/mpx-canvas').default
const { WEBVIEW_TARGET } = require('../../../lib/runtime/components/react/mpx-canvas/utils')

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxCanvas', () => {
  it('bridges canvas messages, context, image and imageData helpers', async () => {
    const binderror = jest.fn()
    const ref = React.createRef<any>()
    render(<MpxCanvas ref={ref} style={{ width: 120, height: 80 }} binderror={binderror} />)

    const webView = getWebViews()[0]
    act(() => {
      fireEvent(webView, 'load')
    })

    const canvas = ref.current.getNodeInstance().instance.node
    const context = canvas.getContext('2d')
    expect(context).toBe(canvas.context2D)
    expect(canvas.getContext('webgl')).toBeNull()
    context.fillStyle = '#ff0000'
    context.fillRect(0, 0, 10, 10)

    const image = canvas.createImage(20, 30)
    const onload = jest.fn()
    image.onload = onload
    fireEvent(webView, 'message', {
      nativeEvent: {
        data: JSON.stringify({
          type: 'event',
          meta: {},
          payload: {
            type: 'event',
            payload: {
              type: 'load',
              target: {
                [WEBVIEW_TARGET]: image[WEBVIEW_TARGET],
                width: 22
              }
            }
          }
        })
      }
    })
    expect(onload).toHaveBeenCalledWith(expect.objectContaining({
      type: 'load',
      target: expect.objectContaining({ width: 22 })
    }))

    const imageData = canvas.createImageData([1, 2, 3, 4], 1, 1)
    expect(imageData.canvas).toBe(canvas)
    fireEvent(webView, 'message', {
      nativeEvent: {
        data: JSON.stringify({
          type: 'error',
          payload: { message: 'canvas failed' }
        })
      }
    })
    expect(binderror).toHaveBeenCalledWith(expect.objectContaining({
      detail: { errMsg: 'canvas failed' }
    }))
  })

  it('resolves canvas postMessage json/blob and constructor payloads', async () => {
    jest.useFakeTimers()
    const ref = React.createRef<any>()
    render(<MpxCanvas ref={ref} style={{ width: 120, height: 80 }} />)
    const webView = getWebViews()[0]
    act(() => {
      fireEvent(webView, 'load')
    })
    const canvas = ref.current.getNodeInstance().instance.node
    const jsonPromise = canvas.postMessage({
      type: 'exec',
      payload: {
        target: 'canvas',
        method: 'toDataURL',
        args: []
      }
    })
    const jsonId = Object.keys(canvas.bus._messageListeners)[0]
    act(() => {
      fireEvent(webView, 'message', {
        nativeEvent: {
          data: JSON.stringify({
            id: jsonId,
            type: 'json',
            payload: { ok: true },
            meta: {}
          })
        }
      })
    })
    await expect(jsonPromise).resolves.toEqual({ ok: true })

    const blobPromise = canvas.postMessage({
      type: 'exec',
      payload: {
        target: 'canvas',
        method: 'toBlob',
        args: []
      }
    })
    const blobId = Object.keys(canvas.bus._messageListeners)[0]
    act(() => {
      fireEvent(webView, 'message', {
        nativeEvent: {
          data: JSON.stringify({
            id: blobId,
            type: 'blob',
            payload: 'Ym9keQ==',
            meta: {}
          })
        }
      })
    })
    await expect(blobPromise).resolves.toBe('decoded:Ym9keQ==')

    const listener = jest.fn()
    canvas.addMessageListener(listener)
    fireEvent(webView, 'message', {
      nativeEvent: {
        data: JSON.stringify({
          type: 'json',
          meta: {
            constructor: 'CanvasGradient',
            target: 'gradient-id'
          },
          args: [],
          payload: { color: 'red' }
        })
      }
    })
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      color: 'red',
      [WEBVIEW_TARGET]: 'gradient-id'
    }))
    jest.useRealTimers()
  })

  it('removes canvas message listeners and resolves postMessage errors', async () => {
    const binderror = jest.fn()
    const ref = React.createRef<any>()
    render(<MpxCanvas ref={ref} style={{ width: 120, height: 80 }} binderror={binderror} />)
    const webView = getWebViews()[0]
    act(() => {
      fireEvent(webView, 'load')
    })
    const canvas = ref.current.getNodeInstance().instance.node
    const listener = jest.fn()
    const removeListener = canvas.addMessageListener(listener)
    removeListener()
    fireEvent(webView, 'message', {
      nativeEvent: {
        data: JSON.stringify({
          type: 'json',
          meta: {},
          payload: { ignored: true }
        })
      }
    })
    expect(listener).not.toHaveBeenCalled()

    const errorPromise = canvas.postMessage({
      type: 'exec',
      payload: {
        target: 'canvas',
        method: 'toDataURL',
        args: []
      }
    })
    const errorId = Object.keys(canvas.bus._messageListeners)[0]
    act(() => {
      canvas.bus.handle({
        id: errorId,
        type: 'error',
        payload: { message: 'post failed' }
      })
    })
    await errorPromise
    expect(binderror).toHaveBeenCalledWith(expect.objectContaining({
      detail: { errMsg: 'post failed' }
    }))
  })

  it('renders default, android and fixed-position canvas branches', () => {
    const originalMode = (global as any).__mpx_mode__
    const originalVersion = Platform.Version

    ;(global as any).__mpx_mode__ = 'android'
    ;(Platform as any).Version = 29
    render(<MpxCanvas />)
    expect(getWebViews()[0]).toBeTruthy()

    ;(global as any).__mpx_mode__ = originalMode
    ;(Platform as any).Version = originalVersion
    const fixedRender = renderWithPortalHost(
      <MpxCanvas testID="fixed-canvas" style={{ width: 120, height: 80, position: 'fixed' }} />
    )
    expect(getWebViews().length).toBeGreaterThan(0)
    expectPortalHostRendered(fixedRender.toJSON(), 'fixed-canvas')
  })
})
