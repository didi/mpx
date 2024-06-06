import { useRef } from 'react'
import { omit } from '@mpxjs/webpack-plugin/lib/runtime/components/react/utils'
import eventConfigMap from '@mpxjs/webpack-plugin/lib/runtime/components/react/event.config'
import {
  CustomEventDetail,
  RNTouchEvent,
  TouchEventHandlers,
  UseInnerPropsOptions,
  InnerRef,
  LayoutRef,
  TouchItem,
  SetTimeoutReturnType,
  DataSetMap
} from './getInnerListeners.type'

const getTouchEvent = (
  type: string = '',
  event: any = {},
  props: { id?: string;[key: string]: any } = {},
  config: { layoutRef?: LayoutRef } = {}
) => {
  const nativeEvent = event.nativeEvent
  const {
    timestamp,
    pageX,
    pageY,
    touches = [],
    changedTouches = []
  } = nativeEvent
  const { id } = props
  const { layoutRef = {} } = config
  return {
    ...event,
    type,
    timeStamp: timestamp,
    target: {
      ...(event.target || {}),
      id: id || '',
      dataset: getDataSet(props),
      offsetLeft: layoutRef.current?.offsetLeft || 0,
      offsetTop: layoutRef.current?.offsetTop || 0
    },
    detail: {
      x: pageX,
      y: pageY
    },
    touches: touches.map((item: TouchItem) => {
      return {
        identifier: item.identifier,
        pageX: item.pageX,
        pageY: item.pageY,
        clientX: item.locationX,
        clientY: item.locationY
      }
    }),
    changedTouches: changedTouches.map((item: TouchItem) => {
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

export const getDataSet = (props: Record<string, any>): Record<string, any> => {
  const result: DataSetMap = {}

  for (const key in props) {
    if (key.indexOf('data-') === 0) {
      const newKey = key.substr(5)
      result[newKey] = props[key]
    }
  }

  return result
}

export const getCustomEvent = (
  type: string = '',
  oe: any = {},
  { detail = {}, layoutRef = {} }: { detail?: CustomEventDetail; layoutRef?: LayoutRef },
  props: { [key: string]: any } = {}
) => {
  return {
    ...oe,
    type,
    detail,
    target: {
      ...(oe.target || {}),
      id: props.id || '',
      dataset: getDataSet(props),
      offsetLeft: layoutRef.current?.offsetLeft || 0,
      offsetTop: layoutRef.current?.offsetTop || 0
    }

  }
}

const useInnerProps = (
  props: UseInnerPropsOptions['props'] = {},
  additionalProps: UseInnerPropsOptions['additionalProps'] = {},
  removeProps: UseInnerPropsOptions['removeProps'] = [],
  rawConfig: UseInnerPropsOptions['config'] = {}
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

  const propsRef = useRef<any>({})
  const eventConfig: { [key: string]: string[] } = {}
  const config = rawConfig

  propsRef.current = { ...props, ...additionalProps }

  for (const key in eventConfigMap) {
    if (propsRef.current[key]) {
      eventConfig[key] = eventConfigMap[key]
    }
  }

  if (!(Object.keys(eventConfig).length) || config.disableTouch) {
    return omit(propsRef.current, removeProps)
  }

  function handleEmitEvent(
    events: string[],
    type: string,
    oe: any
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
  function handleTouchstart(e: RNTouchEvent, type: 'bubble' | 'capture') {
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

  function handleTouchmove(e: RNTouchEvent, type: 'bubble' | 'capture') {
    const bubbleTouchEvent = ['catchtouchmove', 'bindtouchmove']
    const captureTouchEvent = ['capture-catchtouchmove', 'capture-bindtouchmove']
    const tapDetailInfo = ref.current.mpxPressInfo.detail || { x: 0, y: 0 }
    const nativeEvent = e.nativeEvent
    const currentPageX = nativeEvent.changedTouches[0].pageX
    const currentPageY = nativeEvent.changedTouches[0].pageY
    const currentTouchEvent = type === 'bubble' ? bubbleTouchEvent : captureTouchEvent
    if (Math.abs(currentPageX - tapDetailInfo.x) > 1 || Math.abs(currentPageY - tapDetailInfo.y) > 1) {
      ref.current.needPress[type] = false
      ref.current.startTimer[type] && clearTimeout(ref.current.startTimer[type] as SetTimeoutReturnType)
      ref.current.startTimer[type] = null
    }
    handleEmitEvent(currentTouchEvent, 'touchmove', e)
  }

  function handleTouchend(e: RNTouchEvent, type: 'bubble' | 'capture') {
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
      handleEmitEvent(currentTapEvent, 'tap', e)
    }
  }

  function handleTouchcancel(e: RNTouchEvent, type: 'bubble' | 'capture') {
    const bubbleTouchEvent = ['catchtouchcancel', 'bindtouchcancel']
    const captureTouchEvent = ['capture-catchtouchcancel', 'capture-bindtouchcancel']
    const currentTouchEvent = type === 'bubble' ? bubbleTouchEvent : captureTouchEvent
    ref.current.startTimer[type] && clearTimeout(ref.current.startTimer[type] as SetTimeoutReturnType)
    ref.current.startTimer[type] = null
    handleEmitEvent(currentTouchEvent, 'touchcancel', e)
  }

  const touchEventList = [{
    eventName: 'onTouchStart',
    handler: (e: RNTouchEvent) => {
      handleTouchstart(e, 'bubble')
    }
  }, {
    eventName: 'onTouchMove',
    handler: (e: RNTouchEvent) => {
      handleTouchmove(e, 'bubble')
    }
  }, {
    eventName: 'onTouchEnd',
    handler: (e: RNTouchEvent) => {
      handleTouchend(e, 'bubble')
    }
  }, {
    eventName: 'onTouchCancel',
    handler: (e: RNTouchEvent) => {
      handleTouchcancel(e, 'bubble')
    }
  }, {
    eventName: 'onTouchStartCapture',
    handler: (e: RNTouchEvent) => {
      handleTouchstart(e, 'capture')
    }
  }, {
    eventName: 'onTouchMoveCapture',
    handler: (e: RNTouchEvent) => {
      handleTouchmove(e, 'capture')
    }
  }, {
    eventName: 'onTouchEndCapture',
    handler: (e: RNTouchEvent) => {
      handleTouchend(e, 'capture')
    }
  }, {
    eventName: 'onTouchCancelCapture',
    handler: (e: RNTouchEvent) => {
      handleTouchcancel(e, 'capture')
    }
  }]

  const events: TouchEventHandlers = {}

  const transformedEventKeys: string[] = []
  for (const key in eventConfig) {
    transformedEventKeys.push(...eventConfig[key])
  }

  const finalEventKeys = [...new Set(transformedEventKeys)]


  touchEventList.forEach((item) => {
    if (finalEventKeys.includes(item.eventName)) {
      events[item.eventName] = item.handler
    }
  })

  const rawEventKeys = Object.keys(eventConfig)

  return {
    ...events,
    ...omit(propsRef.current, [...rawEventKeys, ...removeProps])
  }
}
export default useInnerProps
