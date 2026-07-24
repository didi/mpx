/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { resetMpxRuntimeGlobals, renderWithRoute } from './rn-component-test-utils'

const mockWatch = jest.fn(() => jest.fn())
jest.mock('@mpxjs/core', () => ({
  watch: mockWatch
}))

let mockCodeScannerOptions: any
let mockCameraFormatArgs: any
const mockCameraMethods = {
  takePhoto: jest.fn(() => Promise.resolve({ path: '/tmp/photo.jpg' })),
  startRecording: jest.fn(),
  stopRecording: jest.fn(() => Promise.resolve())
}

jest.mock('react-native-vision-camera', () => {
  const mockReact = require('react')
  const MockCamera = mockReact.forwardRef((props: any, ref: any) => {
    mockReact.useImperativeHandle(ref, () => mockCameraMethods)
    return mockReact.createElement('Camera', Object.assign({ testID: 'mock-camera' }, props))
  })
  return {
    __esModule: true,
    Camera: MockCamera,
    useCameraDevice: jest.fn((position) => ({ position, maxZoom: 8 })),
    useCameraFormat: jest.fn((device, args) => {
      mockCameraFormatArgs = { device, args }
      return { width: 1920, height: 1080 }
    }),
    useCodeScanner: jest.fn((options) => {
      mockCodeScannerOptions = options
      return options
    })
  }
})

const MpxCamera = require('../../../../lib/runtime/components/react/mpx-camera').default
const { RouteContext } = require('../../../../lib/runtime/components/react/context')

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
  mockCodeScannerOptions = null
  mockCameraFormatArgs = null
  mockCameraMethods.takePhoto.mockResolvedValue({ path: '/tmp/photo.jpg' })
  mockCameraMethods.startRecording.mockImplementation((options) => {
    options.onRecordingFinished({ path: '/tmp/video.mp4', duration: 2 })
  })
  mockCameraMethods.stopRecording.mockResolvedValue(undefined)
})

describe('MpxCamera', () => {
  it('renders after permission, emits scan/init/stop events and exposes navigation camera methods', async () => {
    const navigation: any = {}
    const bindinitdone = jest.fn()
    const bindstop = jest.fn()
    const bindscancode = jest.fn()

    renderWithRoute(
      <MpxCamera
        mode="scanCode"
        device-position="front"
        resolution="high"
        frame-size="large"
        flash="on"
        style={{ width: 200, height: 100 }}
        bindinitdone={bindinitdone}
        bindstop={bindstop}
        bindscancode={bindscancode}
      />,
      navigation
    )

    await act(async () => {
      await Promise.resolve()
    })

    const camera = screen.getByTestId('mock-camera')
    expect(camera.props.device.position).toBe('front')
    expect(camera.props.torch).toBe('on')
    expect(mockCameraFormatArgs.args[0].photoResolution).toBe('max')
    fireEvent(camera, 'initialized')
    fireEvent(camera, 'stopped')
    mockCodeScannerOptions.onCodeScanned([
      { type: 'qr', value: 'https://example.com', frame: { x: '1', y: '2', width: '3', height: '4' } }
    ])

    expect(bindinitdone).toHaveBeenCalledWith(expect.objectContaining({
      type: 'initdone',
      detail: { maxZoom: 8 }
    }))
    expect(bindstop).toHaveBeenCalledWith(expect.objectContaining({ type: 'stop' }))
    expect(bindscancode).toHaveBeenCalledWith(expect.objectContaining({
      type: 'scancode',
      detail: expect.objectContaining({
        result: 'https://example.com',
        type: 'QR_CODE',
        scanArea: [1, 2, 3, 4]
      })
    }))
    mockCodeScannerOptions.onCodeScanned([
      { type: 'ean_13', value: '978' }
    ])
    expect(bindscancode).toHaveBeenLastCalledWith(expect.objectContaining({
      detail: {
        result: '978',
        type: 'EAN_13',
        scanArea: [0, 0, 0, 0]
      }
    }))

    const fail = jest.fn()
    const complete = jest.fn()
    navigation.camera.takePhoto({ fail, complete })
    expect(fail).toHaveBeenCalledWith({ errMsg: 'Not allow to invoke takePhoto in \'scanCode\' mode.' })
    expect(complete).toHaveBeenCalled()
    navigation.camera.startRecord()
    navigation.camera.stopRecord()
    expect(mockCameraMethods.startRecording).not.toHaveBeenCalled()
    expect(mockCameraMethods.stopRecording).not.toHaveBeenCalled()
  })

  it('supports photo and recording APIs in normal mode', async () => {
    jest.useFakeTimers()
    const navigation: any = {}
    renderWithRoute(<MpxCamera mode="normal" style={{ width: 100, height: 80 }} />, navigation)
    await act(async () => {
      await Promise.resolve()
    })

    const photoSuccess = jest.fn()
    const photoComplete = jest.fn()
    await act(async () => {
      navigation.camera.setZoom(3)
      navigation.camera.takePhoto({ quality: 'high', success: photoSuccess, complete: photoComplete })
      await Promise.resolve()
    })
    expect(mockCameraMethods.takePhoto).toHaveBeenCalledWith({ quality: 90 })
    expect(photoSuccess).toHaveBeenCalledWith({ errMsg: 'takePhoto:ok', tempImagePath: '/tmp/photo.jpg' })

    const recordSuccess = jest.fn()
    navigation.camera.startRecord({ timeout: 500, success: recordSuccess })
    expect(recordSuccess).toHaveBeenCalledWith({ errMsg: 'startRecord:ok' })
    const stopSuccess = jest.fn()
    navigation.camera.stopRecord({ success: stopSuccess })
    await act(async () => {
      await Promise.resolve()
      jest.advanceTimersByTime(250)
    })
    expect(stopSuccess).toHaveBeenCalledWith({
      errMsg: 'stopRecord:ok',
      tempVideoPath: '/tmp/video.mp4',
      duration: 2000
    })
    jest.useRealTimers()
  })

  it('handles recording errors, timeout stop failures and page active state', async () => {
    jest.useFakeTimers()
    const navigation: any = {}
    let watchCallback: Function = jest.fn()
    mockWatch.mockImplementationOnce((getter, callback) => {
      watchCallback = callback
      return jest.fn()
    })
    ;(global as any).__mpxPageStatusMap = { 1: 'show' }
    mockCameraMethods.startRecording.mockImplementationOnce(() => undefined)
    mockCameraMethods.stopRecording.mockRejectedValueOnce(new Error('timeout stop failed'))

    renderWithRoute(<MpxCamera mode="normal" style={{ width: 100, height: 80 }} />, navigation)
    await act(async () => {
      await Promise.resolve()
    })

    const timeoutCallback = jest.fn()
    navigation.camera.startRecord({ timeout: 1, timeoutCallback })
    act(() => {
      mockCameraMethods.startRecording.mock.calls[0][0].onRecordingError(new Error('recording bad'))
      watchCallback('hide')
    })
    expect(timeoutCallback).toHaveBeenCalledWith(expect.objectContaining({
      errMsg: 'startRecord:fail during recording'
    }))
    expect(screen.getByTestId('mock-camera').props.isActive).toBe(false)

    act(() => {
      watchCallback('show')
    })
    expect(screen.getByTestId('mock-camera').props.isActive).toBe(true)

    navigation.camera.startRecord({ timeout: 1 })
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(mockCameraMethods.stopRecording).toHaveBeenCalled()
    jest.useRealTimers()
  })

  it('renders when permission hook is not configured', async () => {
    delete (global as any).__mpx.config.rnConfig.cameraPermission
    renderWithRoute(<MpxCamera mode="normal" style={{ width: 100, height: 80 }} />)
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByTestId('mock-camera')).toBeTruthy()
  })

  it('handles camera permission and method failure paths', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    ;(global as any).__mpx.config.rnConfig.cameraPermission = jest.fn(() => Promise.reject(new Error('denied')))
    const navigation: any = {}
    const { queryByTestId, rerender, unmount } = renderWithRoute(
      <MpxCamera mode="normal" style={{ width: 100, height: 80 }} />,
      navigation,
      2
    )
    await act(async () => {
      await Promise.resolve()
    })
    expect(queryByTestId('mock-camera')).toBeNull()

    ;(global as any).__mpx.config.rnConfig.cameraPermission = jest.fn(() => Promise.resolve(true))
    navigation.camera = { stale: true }
    rerender(
      <RouteContext.Provider value={{ pageId: 2, navigation }}>
        <MpxCamera mode="normal" style={{ width: 100, height: 80 }} />
      </RouteContext.Provider>
    )
    await act(async () => {
      await Promise.resolve()
    })
    expect(queryByTestId('mock-camera')).toBeNull()
    expect(warnSpy).toHaveBeenCalled()

    unmount()
    const methodNavigation: any = {}
    renderWithRoute(<MpxCamera mode="normal" style={{ width: 100, height: 80 }} />, methodNavigation)
    await act(async () => {
      await Promise.resolve()
    })
    mockCameraMethods.takePhoto.mockRejectedValueOnce(new Error('photo failed'))
    const photoFail = jest.fn()
    await act(async () => {
      methodNavigation.camera.takePhoto({ fail: photoFail })
      await Promise.resolve()
    })
    expect(photoFail).toHaveBeenCalledWith({ errMsg: 'takePhoto:fail' })

    mockCameraMethods.startRecording.mockImplementationOnce(() => {
      throw new Error('start failed')
    })
    const recordFail = jest.fn()
    methodNavigation.camera.startRecord({ fail: recordFail })
    expect(recordFail).toHaveBeenCalledWith({ errMsg: 'startRecord:fail start failed' })

    mockCameraMethods.stopRecording.mockRejectedValueOnce(new Error('stop failed'))
    const stopFail = jest.fn()
    await act(async () => {
      methodNavigation.camera.stopRecord({ fail: stopFail })
      await Promise.resolve()
    })
    expect(stopFail).toHaveBeenCalledWith({ errMsg: 'stopRecord:fail stop failed' })
    warnSpy.mockRestore()
  })

  it('does not render without a matching camera device', async () => {
    const { useCameraDevice } = require('react-native-vision-camera')
    ;(useCameraDevice as jest.Mock).mockReturnValueOnce(null).mockReturnValueOnce(null)
    const noDevice = renderWithRoute(<MpxCamera />)
    await act(async () => {
      await Promise.resolve()
    })
    expect(noDevice.queryByTestId('mock-camera')).toBeNull()
  })

  it('renders with default props outside route context', async () => {
    const noRoute = render(<MpxCamera />)
    await act(async () => {
      await Promise.resolve()
    })
    const camera = noRoute.getByTestId('mock-camera')
    expect(camera.props.device.position).toBe('back')
    expect(camera.props.torch).toBe('auto')
    expect(mockCameraFormatArgs.args[0]).toEqual({
      photoResolution: { width: 1920, height: 1080 },
      videoResolution: { width: 1920, height: 1080 }
    })
  })
})
