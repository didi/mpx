import React, { forwardRef, useRef } from 'react'
import { Camera, useCameraDevice } from 'react-native-vision-camera'
import useNodesRef, { HandlerRef } from './useNodesRef'

interface CameraProps {
  mode?: 'normal' | 'scanCode'
  resolution?: 'low' | 'medium' | 'high'
  devicePosition?: 'front' | 'back'
  flash?: 'auto' | 'on' | 'off'
  frameSize?: 'small' | 'medium' | 'large'
  style?: Record<string, any>
  bindstop?: () => void
  binderror?: (error: { message: string }) => void
  bindinitdone?: (result: { type: string; data: string }) => void
  bindscancode?: (result: { type: string; data: string }) => void
}
const _camera = forwardRef<HandlerRef<Camera, CameraProps>, CameraProps>((props: CameraProps): JSX.Element | null => {
  const cameraRef = useRef<Camera>(null)
  const {
    mode = 'normal',
    resolution = 'medium',
    devicePosition = 'back',
    flash = 'auto',
    frameSize = 'medium'
  } = props

  const device = useCameraDevice(devicePosition || 'back')
  return (
    <Camera
      ref={cameraRef}
      photo={true}
      video={true}
      device={device}
      style={{ flex: 1 }}
      {...props}
    />
  )
})

_camera.displayName = 'MpxCamera'

export default _camera