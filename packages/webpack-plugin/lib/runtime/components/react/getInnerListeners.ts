import { useRef } from 'react'
import { omit } from './utils'
import eventConfigMap from './event.config'
import {
  Props,
  AdditionalProps,
  RemoveProps,
  UseInnerPropsConfig,
  InnerRef,
  SetTimeoutReturnType,
  DataSetType,
  LayoutRef,
  NativeTouchEvent
} from './types/getInnerListeners'

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
  return {
    ...event,
    type,
    timeStamp: timestamp,
    currentTarget: {
      ...(event.currentTarget || {}),
      id: id || '',
      dataset: getDataSet(props),
      offsetLeft: layoutRef?.current?.offsetLeft || 0,
      offsetTop: layoutRef?.current?.offsetTop || 0
    },
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
  }
}

export const getDataSet = (props: Record<string, any>) => {
  const result: DataSetType = {}

  for (const key in props) {
    if (key.indexOf('data-') === 0) {
      const newKey = key.substr(5)
      result[newKey] = props[key]
    }
  }

  return result
}

export const getCustomEvent = (
  type = '',
  oe: any = {},
  { detail = {}, layoutRef }: { detail?: Record<string, unknown>; layoutRef: LayoutRef },
  props: Props = {}
) => {
  return {
    ...oe,
    type,
    detail,
    target: {
      ...(oe.target || {}),
      id: props.id || '',
      dataset: getDataSet(props),
      offsetLeft: layoutRef?.current?.offsetLeft || 0,
      offsetTop: layoutRef?.current?.offsetTop || 0
    },
    persist: oe.persist,
    stopPropagation: oe.stopPropagation,
    preventDefault: oe.preventDefault
  }
}

const useInnerProps = (
  props: Props = {},
  additionalProps:AdditionalProps = {},
  userRemoveProps:RemoveProps = [],
  rawConfig: UseInnerPropsConfig
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

  const propsMap = additionalProps.propsMap || {}
  const propsMapKeys = Object.keys(propsMap || {})
  const transformPropsMap:Record<string, string|Function> = {}
  const partAdditionalProps = omit(additionalProps, ['propsMap'])

  for (const key in propsMap) {
    const originPropsValue = props[key]
    const transformPropsValue = propsMap[key]
    if (originPropsValue) {
      if (typeof propsMap[key] === 'string') {
        transformPropsMap[transformPropsValue] = originPropsValue
      } else {
        transformPropsMap[transformPropsValue.name] = transformPropsValue?.getter?.(originPropsValue)
      }
    }
  }

  propsRef.current = { ...props, ...partAdditionalProps, ...transformPropsMap }

  for (const key in eventConfigMap) {
    if (propsRef.current[key]) {
      eventConfig[key] = eventConfigMap[key]
    }
  }

  if (!(Object.keys(eventConfig).length) || config.disableTouch) {
    return omit(propsRef.current, [...removeProps, ...propsMapKeys])
  }

  function handleEmitEvent (
    events: string[],
    type: string,
    oe: NativeTouchEvent
  ) {
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

  function checkIsNeedPress (e: NativeTouchEvent, type: 'bubble' | 'capture') {
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

  function handleTouchstart (e: NativeTouchEvent, type: 'bubble' | 'capture') {
    e.persist()
    const bubbleTouchEvent = ['catchtouchstart', 'bindtouchstart']
    const bubblePressEvent = ['catchlongpress', 'bindlongpress']
    const captureTouchEvent = ['capture-catchtouchstart', 'capture-bindtouchstart']
    const capturePressEvent = ['capture-catchlongpress', 'capture-bindlongpress']
    ref.current.startTimer[type] = null
    ref.current.needPress[type] = true
    const nativeEvent = e.nativeEvent
    ref.current.mpxPressInfo.detail = {
      x: nativeEvent.changedTouches[0].pageX,
      y: nativeEvent.changedTouches[0].pageY
    }
    const currentTouchEvent = type === 'bubble' ? bubbleTouchEvent : captureTouchEvent
    const currentPressEvent = type === 'bubble' ? bubblePressEvent : capturePressEvent
    handleEmitEvent(currentTouchEvent, 'touchstart', e)
    const { catchlongpress, bindlongpress, 'capture-catchlongpress': captureCatchlongpress, 'capture-bindlongpress': captureBindlongpress } = propsRef.current
    if (catchlongpress || bindlongpress || captureCatchlongpress || captureBindlongpress) {
      ref.current.startTimer[type] = setTimeout(() => {
        ref.current.needPress[type] = false
        handleEmitEvent(currentPressEvent, 'longpress', e)
      }, 350)
    }
  }

  function handleTouchmove (e: NativeTouchEvent, type: 'bubble' | 'capture') {
    const bubbleTouchEvent = ['catchtouchmove', 'bindtouchmove']
    const captureTouchEvent = ['capture-catchtouchmove', 'capture-bindtouchmove']
    const currentTouchEvent = type === 'bubble' ? bubbleTouchEvent : captureTouchEvent
    handleEmitEvent(currentTouchEvent, 'touchmove', e)
    checkIsNeedPress(e, type)
  }

  function handleTouchend (e: NativeTouchEvent, type: 'bubble' | 'capture') {
    // move event may not be triggered
    checkIsNeedPress(e, type)
    const bubbleTouchEvent = ['catchtouchend', 'bindtouchend']
    const bubbleTapEvent = ['catchtap', 'bindtap']
    const captureTouchEvent = ['capture-catchtouchend', 'capture-bindtouchend']
    const captureTapEvent = ['capture-catchtap', 'capture-bindtap']
    const currentTouchEvent = type === 'bubble' ? bubbleTouchEvent : captureTouchEvent
    const currentTapEvent = type === 'bubble' ? bubbleTapEvent : captureTapEvent
    ref.current.startTimer[type] && clearTimeout(ref.current.startTimer[type] as SetTimeoutReturnType)
    ref.current.startTimer[type] = null
    handleEmitEvent(currentTouchEvent, 'touchend', e)
    if (ref.current.needPress[type]) {
      if (type === 'bubble' && config.disableTap) {
        return
      }
      handleEmitEvent(currentTapEvent, 'tap', e)
    }
  }

  function handleTouchcancel (e: NativeTouchEvent, type: 'bubble' | 'capture') {
    const bubbleTouchEvent = ['catchtouchcancel', 'bindtouchcancel']
    const captureTouchEvent = ['capture-catchtouchcancel', 'capture-bindtouchcancel']
    const currentTouchEvent = type === 'bubble' ? bubbleTouchEvent : captureTouchEvent
    ref.current.startTimer[type] && clearTimeout(ref.current.startTimer[type] as SetTimeoutReturnType)
    ref.current.startTimer[type] = null
    handleEmitEvent(currentTouchEvent, 'touchcancel', e)
  }

  const touchEventList = [{
    eventName: 'onTouchStart',
    handler: (e: NativeTouchEvent) => {
      handleTouchstart(e, 'bubble')
    }
  }, {
    eventName: 'onTouchMove',
    handler: (e: NativeTouchEvent) => {
      handleTouchmove(e, 'bubble')
    }
  }, {
    eventName: 'onTouchEnd',
    handler: (e: NativeTouchEvent) => {
      handleTouchend(e, 'bubble')
    }
  }, {
    eventName: 'onTouchCancel',
    handler: (e: NativeTouchEvent) => {
      handleTouchcancel(e, 'bubble')
    }
  }, {
    eventName: 'onTouchStartCapture',
    handler: (e: NativeTouchEvent) => {
      handleTouchstart(e, 'capture')
    }
  }, {
    eventName: 'onTouchMoveCapture',
    handler: (e: NativeTouchEvent) => {
      handleTouchmove(e, 'capture')
    }
  }, {
    eventName: 'onTouchEndCapture',
    handler: (e: NativeTouchEvent) => {
      handleTouchend(e, 'capture')
    }
  }, {
    eventName: 'onTouchCancelCapture',
    handler: (e: NativeTouchEvent) => {
      handleTouchcancel(e, 'capture')
    }
  }]

  const events: Record<string, (e: NativeTouchEvent) => void> = {}

  const transformedEventKeys: string[] = []
  for (const key in eventConfig) {
    transformedEventKeys.push(...eventConfig[key])
  }

  const finalEventKeys = [...new Set(transformedEventKeys)]

  touchEventList.forEach(item => {
    if (finalEventKeys.includes(item.eventName)) {
      events[item.eventName] = item.handler
    }
  })

  const rawEventKeys = Object.keys(eventConfig)

  return {
    ...events,
    ...omit(propsRef.current, [...rawEventKeys, ...removeProps, ...propsMapKeys])
  }
}
export default useInnerProps
