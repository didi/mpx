import { RefObject, MutableRefObject } from 'react'
import { NativeSyntheticEvent } from 'react-native'

type LayoutRef = MutableRefObject<{
  x?: number
  y?: number
  width?: number
  height?: number
  offsetLeft?: number
  offsetTop?: number
} | null>

type InnerRef = MutableRefObject<{
  startTimer: {
    bubble: ReturnType<typeof setTimeout> | null
    capture: ReturnType<typeof setTimeout> | null
  }
  mpxPressInfo: {
    detail: {
      x: number
      y: number
    }
  }
}>

type PropsRef = MutableRefObject<Props>

type EventType = 'bubble' | 'capture'

type Props = Record<string, any>

type AdditionalProps = Record<string, any>

type RemoveProps = string[]

type NativeTouchEvent = NativeSyntheticEvent<NativeEvent>

type Navigation = Record<string, any> | undefined

interface EventConfigDetail {
  bubble: string[],
  capture: string[],
  hasCatch: boolean
}

type EventConfig = {
  innerRef: InnerRef
  propsRef: PropsRef
  disableTap: boolean
  layoutRef: LayoutRef
  navigation: Navigation
  [index: string]: EventConfigDetail
}

interface RawConfig {
  layoutRef?: LayoutRef
  disableTap?: boolean
  [index: string]: any
}

interface NativeEvent {
  timestamp: number
  pageX: number
  pageY: number
  touches: TouchPoint[]
  changedTouches: TouchPoint[]
}

interface TouchPoint {
  identifier: number
  pageX: number
  pageY: number
  clientX: number
  clientY: number
  locationX?: number
  locationY?: number
}

interface DataSetType {
  [key: string]: string
}

interface ExtendedNativeTouchEvent extends NativeTouchEvent {
  _stoppedEventTypes?: Set<string>
}

export {
  NativeTouchEvent,
  Props,
  AdditionalProps,
  RemoveProps,
  UseInnerPropsConfig,
  InnerRef,
  LayoutRef,
  PropsRef,
  DataSetType,
  Navigation,
  ExtendedNativeTouchEvent,
  EventConfig,
  RawConfig,
  EventType
}
