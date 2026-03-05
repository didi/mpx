import React, { createElement, forwardRef, useRef, useCallback, useContext, useState, useEffect } from 'react'
import { useTransformStyle, useLayout, extendObject } from './utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import { noop } from '@mpxjs/utils'
import { RouteContext } from './context'

const qualityValue = {
  high: 90,
  normal: 75,
  low: 50,
  original: 100
}

interface CameraProps {
  mode?: 'normal' | 'scanCode'
  resolution?: 'low' | 'medium' | 'high'
  devicePosition?: 'front' | 'back'
  flash?: 'auto' | 'on' | 'off'
  frameSize?: 'small' | 'medium' | 'large'
  style?: Record<string, any>
  bindstop?: () => void
  binderror?: (error: { message: string }) => void
  bindinitdone?: (result: { type: string, data: string }) => void
  bindscancode?: (result: { type: string, data: string }) => void
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
  'enable-var'?: boolean
  'external-var-context'?: any
}

interface TakePhotoOptions {
  quality?: 'high' | 'normal' | 'low' | 'original'
  success?: (result: { errMsg: string, tempImagePath: string }) => void
  fail?: (result: { errMsg: string }) => void
  complete?: (result: { errMsg: string, tempImagePath?: string }) => void
}

interface RecordOptions {
  timeout?: number
  success?: (result: { errMsg: string }) => void
  fail?: (result: { errMsg: string, error?: any }) => void
  complete?: (result: { errMsg: string }) => void
  timeoutCallback?: (result: { errMsg: string, error?: any }) => void
}

interface StopRecordOptions {
  success?: (result: { errMsg: string, tempVideoPath: string, duration: number }) => void
  fail?: (result: { errMsg: string }) => void
  complete?: (result: { errMsg: string, tempVideoPath?: string, duration?: number }) => void
}

interface CameraRef {
  setZoom: (zoom: number) => void
  takePhoto: (options?: TakePhotoOptions) => void
  startRecord: (options?: RecordOptions) => void
  stopRecord: (options?: StopRecordOptions) => void
}

type HandlerRef<T, P> = {
  current: T | null
}

let RecordRes: any = null

const _camera = forwardRef<HandlerRef<any, CameraProps>, CameraProps>((props: CameraProps, ref): JSX.Element | null => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Camera, useCameraDevice, useCodeScanner, useCameraFormat } = require('react-native-vision-camera')
  const cameraRef = useRef<any>(null)
  const {
    mode = 'normal',
    resolution = 'medium',
    devicePosition = 'back',
    flash = 'auto',
    frameSize = 'medium',
    bindinitdone,
    bindstop,
    bindscancode,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    style = {}
  } = props
  const styleObj = extendObject(
    {},
    style
  )
  const {
    normalStyle,
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(styleObj, {
    enableVar,
    externalVarContext,
    parentFontSize,
    parentWidth,
    parentHeight
  })
  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: cameraRef })
  const isPhoto = mode === 'normal'
  const device = useCameraDevice(devicePosition || 'back')
  const { navigation } = useContext(RouteContext) || {}
  const [zoomValue, setZoomValue] = useState<number>(1)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const hasCamera = useRef(false)

  // 先定义常量，避免在条件判断后使用
  const maxZoom = device?.maxZoom || 1
  const RESOLUTION_MAPPING: Record<string, { width: number, height: number }> = {
    low: { width: 640, height: 480 },
    medium: { width: 1280, height: 720 },
    high: { width: 1920, height: 1080 }
  }
  const FRAME_SIZE_MAPPING: Record<string, { width: number, height: number }> = {
    small: { width: 480, height: 360 },
    medium: { width: 720, height: 540 },
    large: { width: 1080, height: 810 }
  }

  const format = useCameraFormat(device, [
    {
      photoResolution: RESOLUTION_MAPPING[resolution],
      videoResolution: FRAME_SIZE_MAPPING[frameSize] || RESOLUTION_MAPPING[resolution]
    }
  ])

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes: any[]) => {
      const result = codes.map(code => code.value).join(',')
      bindscancode && bindscancode(getCustomEvent('scancode', {}, {
        detail: {
          result: codes.map(code => code.value).join(',')
        }
      }))
    }
  })

  const onInitialized = useCallback(() => {
    bindinitdone && bindinitdone(getCustomEvent('initdone', {}, {
      detail: {
        maxZoom
      }
    }))
  }, [bindinitdone, maxZoom])

  const onStopped = useCallback(() => {
    bindstop && bindstop()
  }, [bindstop])

  const camera: CameraRef = {
    setZoom: (zoom: number) => {
      setZoomValue(zoom)
    },
    takePhoto: (options: TakePhotoOptions = {}) => {
      const { success = noop, fail = noop, complete = noop } = options
      cameraRef.current?.takePhoto?.({
        flash,
        quality: qualityValue[options.quality || 'normal'] as number
      } as any).then((res: { path: any }) => {
        const result = {
          errMsg: 'takePhoto:ok',
          tempImagePath: res.path
        }
        success(result)
        complete(result)
      }).catch(() => {
        const result = {
          errMsg: 'takePhoto:fail'
        }
        fail(result)
        complete(result)
      })
    },
    startRecord: (options: RecordOptions = {}) => {
      let { timeout = 30, success = noop, fail = noop, complete = noop, timeoutCallback = noop } = options
      timeout = timeout > 300 ? 300 : timeout
      let recordTimer: NodeJS.Timeout | null = null
      let isTimeout = false
      try {
        const result = {
          errMsg: 'startRecord:ok'
        }
        success(result)
        complete(result)

        cameraRef.current?.startRecording?.({
          flash,
          onRecordingError: (error: any) => {
            if (recordTimer) clearTimeout(recordTimer)
            const errorResult = {
              errMsg: 'startRecord:fail during recording',
              error: error
            }
            timeoutCallback(errorResult)
          },
          onRecordingFinished: (video: any) => {
            RecordRes = video
            if (recordTimer) clearTimeout(recordTimer)
          }
        })

        recordTimer = setTimeout(() => { // 超时自动停止
          isTimeout = true
          cameraRef.current?.stopRecording().catch(() => {
            // 忽略停止录制时的错误
          })
        }, timeout * 1000)
      } catch (error: any) {
        if (recordTimer) clearTimeout(recordTimer)
        const result = {
          errMsg: 'startRecord:fail ' + (error.message || 'unknown error')
        }
        fail(result)
        complete(result)
      }
    },
    stopRecord: (options: StopRecordOptions = {}) => {
      const { success = noop, fail = noop, complete = noop } = options
      try {
        cameraRef.current?.stopRecording().then(() => {
          setTimeout(() => {
            if (RecordRes) {
              const result = {
                errMsg: 'stopRecord:ok',
                tempVideoPath: RecordRes?.path,
                duration: RecordRes.duration * 1000 // 转成ms
              }
              RecordRes = null
              success(result)
              complete(result)
            }
          }, 200) // 延时200ms，确保录制结果已准备好
        }).catch((e: any) => {
          const result = {
            errMsg: 'stopRecord:fail ' + (e.message || 'promise rejected')
          }
          fail(result)
          complete(result)
        })
      } catch (error: any) {
        const result = {
          errMsg: 'stopRecord:fail ' + (error.message || 'unknown error')
        }
        fail(result)
        complete(result)
      }
    }
  }

  useEffect(() => {
    if (navigation) {
      if (navigation && !navigation.camera) {
        navigation.camera = camera
      } else {
        hasCamera.current = true
        navigation.camera.multi = true
      }
    }
    const checkCameraPermission = async () => {
      try {
        const cameraPermission = global?.__mpx?.config?.rnConfig?.cameraPermission
        if (typeof cameraPermission === 'function') {
          const permissionResult = await cameraPermission()
          setHasPermission(permissionResult === true)
        } else {
          setHasPermission(true)
        }
      } catch (error) {
        setHasPermission(false)
      }
    }
    checkCameraPermission()
    return () => {
      if (navigation && navigation.camera) {
        navigation.camera = null
      }
    }
  }, [])

  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      layoutProps,
      {
        ref: cameraRef,
        style: extendObject({}, normalStyle, layoutStyle),
        isActive: true,
        photo: true,
        video: true,
        onInitialized,
        onStopped,
        device,
        format,
        codeScanner: !isPhoto ? codeScanner : undefined,
        zoom: zoomValue
      }
    ),
    [
      'mode',
      'resolution',
      'frame-size',
      'bindinitdone',
      'bindstop',
      'flash',
      'bindscancode',
      'binderror'
    ],
    {
      layoutRef
    }
  )

  if (!hasPermission || hasCamera.current || !device) {
    return null
  }

  return createElement(Camera, innerProps)
})

_camera.displayName = 'MpxCamera'

export default _camera
