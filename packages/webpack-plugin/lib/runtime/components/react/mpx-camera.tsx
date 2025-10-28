import React, { forwardRef, useRef, useCallback, useContext, useState, useEffect } from 'react'
import { Camera, useCameraDevice, useCodeScanner, useCameraFormat, useFrameProcessor } from 'react-native-vision-camera'
import { getCustomEvent } from './getInnerListeners'
import { RouteContext } from './context'

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
}

interface CameraRef {
  setZoom: (zoom: number) => void
  getTakePhoto: () => (() => Promise<any>) | undefined
  getStartRecord: () => ((options: any) => void) | undefined
  getStopRecord: () => (() => void) | undefined
}

type HandlerRef<T, P> = {
  // 根据实际的 HandlerRef 类型定义调整
  current: T | null
}

const _camera = forwardRef<HandlerRef<Camera, CameraProps>, CameraProps>((props: CameraProps, ref): JSX.Element | null => {
  const cameraRef = useRef<Camera>(null)
  const {
    mode = 'normal',
    resolution = 'medium',
    devicePosition = 'back',
    flash = 'auto',
    frameSize = 'medium',
    bindinitdone,
    bindstop,
    bindscancode
  } = props

  const isPhoto = mode === 'normal'
  const device = useCameraDevice(devicePosition || 'back')
  const { navigation } = useContext(RouteContext) || {}
  const [zoomValue, setZoomValue] = useState<number>(1)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

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

  // 所有 Hooks 必须在条件判断之前调用
  const format = useCameraFormat(device, [
    {
      photoResolution: RESOLUTION_MAPPING[resolution],
      videoResolution: FRAME_SIZE_MAPPING[frameSize] || RESOLUTION_MAPPING[resolution]
    }
  ])

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
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

  // 检查相机权限
  useEffect(() => {
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
  }, [])

  const camera: CameraRef = {
    setZoom: (zoom: number) => {
      setZoomValue(zoom)
    },
    getTakePhoto: () => {
      return cameraRef.current?.takePhoto
    },
    getStartRecord: () => {
      return cameraRef.current?.startRecording
    },
    getStopRecord: () => {
      return cameraRef.current?.stopRecording
    }
  }

  if (navigation) {
    navigation.camera = camera
  }

  // 所有 Hooks 调用完成后再进行条件判断
  if (hasPermission === null) {
    return null
  }

  if (!hasPermission) {
    return null
  }

  if (!device) {
    return null
  }

  return (
    <Camera
      ref={cameraRef}
      isActive={true}
      photo={isPhoto}
      video={true}
      onInitialized={onInitialized}
      onStopped={onStopped}
      device={device}
      flash={flash}
      format={format}
      codeScanner={!isPhoto ? codeScanner : undefined}
      style={{ flex: 1 }}
      zoom={zoomValue}
      {...props}
    />
  )
})

_camera.displayName = 'MpxCamera'

export default _camera
