import { useRef, useCallback, useMemo } from 'react'
import { hasOwn, collectDataset } from '@mpxjs/utils'
import { omit, extendObject } from './utils'
import { eventConfigMap, createTouchEventList } from './event.config'
import {
  Props,
  AdditionalProps,
  RemoveProps,
  UseInnerPropsConfig,
  InnerRef,
  SetTimeoutReturnType,
  LayoutRef,
  NativeTouchEvent
} from './types/getInnerListeners'

const BUBBLE_TOUCH_START = ['catchtouchstart', 'bindtouchstart']
const BUBBLE_PRESS = ['catchlongpress', 'bindlongpress']
const CAPTURE_TOUCH_START = ['capture-catchtouchstart', 'capture-bindtouchstart']
const CAPTURE_PRESS = ['capture-catchlongpress', 'capture-bindlongpress']
const BUBBLE_TOUCH_MOVE = ['catchtouchmove', 'bindtouchmove']
const CAPTURE_TOUCH_MOVE = ['capture-catchtouchmove', 'capture-bindtouchmove']
const BUBBLE_TOUCH_END = ['catchtouchend', 'bindtouchend']
const CAPTURE_TOUCH_END = ['capture-catchtouchend', 'capture-bindtouchend']
const BUBBLE_TAP = ['catchtap', 'bindtap']
const CAPTURE_TAP = ['capture-catchtap', 'capture-bindtap']
const BUBBLE_TOUCH_CANCEL = ['catchtouchcancel', 'bindtouchcancel']
const CAPTURE_TOUCH_CANCEL = ['capture-catchtouchcancel', 'capture-bindtouchcancel']

const getTouchEvent = (
  type: string,
  event: NativeTouchEvent,
  props: Props,
  config: UseInnerPropsConfig
) => {
  const nativeEvent = event.nativeEvent
  const {
    timestamp,
    pageX,
    pageY,
    touches,
    changedTouches
  } = nativeEvent
  const { id } = props
  const { layoutRef } = config

  const currentTarget = extendObject(
    event.currentTarget || {},
    {
      id: id || '',
      dataset: collectDataset(props),
      offsetLeft: layoutRef?.current?.offsetLeft || 0,
      offsetTop: layoutRef?.current?.offsetTop || 0
    }
  )

  return extendObject(event, {
    type,
    timeStamp: timestamp,
    currentTarget,
    detail: {
      x: pageX,
      y: pageY
    },
    touches: touches.map(item => {
      return {
        identifier: item.identifier,
        pageX: item.pageX,
        pageY: item.pageY,
        clientX: item.locationX,
        clientY: item.locationY
      }
    }),
    changedTouches: changedTouches.map(item => {
      return {
        identifier: item.identifier,
        pageX: item.pageX,
        pageY: item.pageY,
        clientX: item.locationX,
        clientY: item.locationY
      }
    }),
    persist: event.persist,
    stopPropagation: event.stopPropagation,
    preventDefault: event.preventDefault
  })
}

export const getCustomEvent = (
  type = '',
  oe: any = {},
  { detail = {}, layoutRef }: { detail?: Record<string, unknown>; layoutRef: LayoutRef },
  props: Props = {}
) => {
  const targetInfo = extendObject(oe.target || {}, {
    id: props.id || '',
    dataset: collectDataset(props),
    offsetLeft: layoutRef?.current?.offsetLeft || 0,
    offsetTop: layoutRef?.current?.offsetTop || 0
  })
  return extendObject(oe, {
    type,
    detail,
    target: targetInfo,
    persist: oe.persist,
    stopPropagation: oe.stopPropagation,
    preventDefault: oe.preventDefault
  })
}

const useInnerProps = (
  props: Props = {},
  additionalProps: AdditionalProps = {},
  userRemoveProps: RemoveProps = [],
  rawConfig?: UseInnerPropsConfig
) => {
  const ref = useRef<InnerRef>({
    startTimer: {
      bubble: null,
      capture: null
    },
    needPress: {
      bubble: false,
      capture: false
    },
    mpxPressInfo: {
      detail: {
        x: 0,
        y: 0
      }
    }
  })

  const propsRef = useRef<Record<string, any>>({})
  const eventConfig: { [key: string]: string[] } = {}
  const config = rawConfig || { layoutRef: { current: {} }, disableTouch: false, disableTap: false }
  const removeProps = [
    'children',
    'enable-background',
    'enable-offset',
    'enable-var',
    'external-var-context',
    'parent-font-size',
    'parent-width',
    'parent-height',
    ...userRemoveProps
  ]

  propsRef.current = extendObject(props, additionalProps)

  for (const key in eventConfigMap) {
    if (hasOwn(propsRef.current, key)) {
      eventConfig[key] = eventConfigMap[key]
    }
  }

  if (!(Object.keys(eventConfig).length) || config.disableTouch) {
    return omit(propsRef.current, removeProps)
  }

  const handleEmitEvent = (events: string[], type: string, oe: NativeTouchEvent) => {
    events.forEach(event => {
      if (propsRef.current[event]) {
        const match = /^(catch|capture-catch):?(.*?)(?:\.(.*))?$/.exec(event)
        if (match) {
          oe.stopPropagation()
        }
        propsRef.current[event](getTouchEvent(type, oe, propsRef.current, config))
      }
    })
  }

  const checkIsNeedPress = (e: NativeTouchEvent, type: 'bubble' | 'capture') => {
    const tapDetailInfo = ref.current.mpxPressInfo.detail || { x: 0, y: 0 }
    const nativeEvent = e.nativeEvent
    const currentPageX = nativeEvent.changedTouches[0].pageX
    const currentPageY = nativeEvent.changedTouches[0].pageY
    if (Math.abs(currentPageX - tapDetailInfo.x) > 1 || Math.abs(currentPageY - tapDetailInfo.y) > 1) {
      ref.current.needPress[type] = false
      ref.current.startTimer[type] && clearTimeout(ref.current.startTimer[type] as SetTimeoutReturnType)
      ref.current.startTimer[type] = null
    }
  }

  const handleTouchstart = useCallback((e: NativeTouchEvent, type: 'bubble' | 'capture') => {
    e.persist()
    ref.current.startTimer[type] = null
    ref.current.needPress[type] = true
    const nativeEvent = e.nativeEvent
    ref.current.mpxPressInfo.detail = {
      x: nativeEvent.changedTouches[0].pageX,
      y: nativeEvent.changedTouches[0].pageY
    }
    const currentTouchEvent = type === 'bubble' ? BUBBLE_TOUCH_START : CAPTURE_TOUCH_START
    const currentPressEvent = type === 'bubble' ? BUBBLE_PRESS : CAPTURE_PRESS
    handleEmitEvent(currentTouchEvent, 'touchstart', e)
    const { catchlongpress, bindlongpress, 'capture-catchlongpress': captureCatchlongpress, 'capture-bindlongpress': captureBindlongpress } = propsRef.current
    if (catchlongpress || bindlongpress || captureCatchlongpress || captureBindlongpress) {
      ref.current.startTimer[type] = setTimeout(() => {
        ref.current.needPress[type] = false
        handleEmitEvent(currentPressEvent, 'longpress', e)
      }, 350)
    }
  }, [])

  const handleTouchmove = useCallback((e: NativeTouchEvent, type: 'bubble' | 'capture') => {
    const currentTouchEvent = type === 'bubble' ? BUBBLE_TOUCH_MOVE : CAPTURE_TOUCH_MOVE
    handleEmitEvent(currentTouchEvent, 'touchmove', e)
    checkIsNeedPress(e, type)
  }, [])

  const handleTouchend = useCallback((e: NativeTouchEvent, type: 'bubble' | 'capture') => {
    // move event may not be triggered
    checkIsNeedPress(e, type)
    const currentTouchEvent = type === 'bubble' ? BUBBLE_TOUCH_END : CAPTURE_TOUCH_END
    const currentTapEvent = type === 'bubble' ? BUBBLE_TAP : CAPTURE_TAP
    ref.current.startTimer[type] && clearTimeout(ref.current.startTimer[type] as SetTimeoutReturnType)
    ref.current.startTimer[type] = null
    handleEmitEvent(currentTouchEvent, 'touchend', e)
    if (ref.current.needPress[type]) {
      if (type === 'bubble' && config.disableTap) {
        return
      }
      handleEmitEvent(currentTapEvent, 'tap', e)
    }
  }, [])

  const handleTouchcancel = useCallback((e: NativeTouchEvent, type: 'bubble' | 'capture') => {
    const currentTouchEvent = type === 'bubble' ? BUBBLE_TOUCH_CANCEL : CAPTURE_TOUCH_CANCEL
    ref.current.startTimer[type] && clearTimeout(ref.current.startTimer[type] as SetTimeoutReturnType)
    ref.current.startTimer[type] = null
    handleEmitEvent(currentTouchEvent, 'touchcancel', e)
  }, [])

  const touchEventList = useMemo(() =>
    createTouchEventList(
      handleTouchstart,
      handleTouchmove,
      handleTouchend,
      handleTouchcancel
    ), []
  )

  const events: Record<string, (e: NativeTouchEvent) => void> = {}

  const transformedEventKeys = new Set<string>()
  for (const key in eventConfig) {
    if (propsRef.current[key]) {
      eventConfig[key].forEach(eventKey => transformedEventKeys.add(eventKey))
    }
  }

  touchEventList.forEach(item => {
    if (transformedEventKeys.has(item.eventName)) {
      events[item.eventName] = item.handler
    }
  })

  const rawEventKeys = Object.keys(eventConfig)

  return extendObject(
    events,
    omit(propsRef.current, [...rawEventKeys, ...removeProps])
  )
}
export default useInnerProps
