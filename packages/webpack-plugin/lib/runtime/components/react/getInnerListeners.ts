import { useRef, useMemo } from 'react'
import { collectDataset } from '@mpxjs/utils'
import { extendObject, useNavigation } from './utils'
import eventConfigMap from './event.config'
import {
  Props,
  EventConfig,
  EventConfigRef,
  RawConfig,
  EventType,
  RemoveProps,
  InnerRef,
  LayoutRef,
  ExtendedNativeTouchEvent,
  GlobalEventState,
  TouchHandlerConfig
} from './types/getInnerListeners'

const globalEventState: GlobalEventState = {
  needPress: true,
  identifier: null
}

const baseRemovePropsMap: Record<string, boolean> = {
  children: true,
  'enable-background': true,
  'enable-offset': true,
  'enable-var': true,
  'external-var-context': true,
  'parent-font-size': true,
  'parent-width': true,
  'parent-height': true,
  'enable-text-pass-through': true
}

const getTouchEvent = (
  type: string,
  event: ExtendedNativeTouchEvent,
  config: EventConfig
) => {
  const { navigation, propsRef, layoutRef } = config
  const props = propsRef.current
  const { top: navigationY = 0 } = navigation?.layout || {}
  const nativeEvent = event.nativeEvent
  const { timestamp, pageX, pageY, touches, changedTouches } = nativeEvent
  const { id } = props

  const currentTarget = extendObject({}, event.currentTarget, {
    id: id || '',
    dataset: collectDataset(props),
    offsetLeft: layoutRef.current?.offsetLeft || 0,
    offsetTop: layoutRef.current?.offsetTop || 0
  })

  const pendingProps = (event as any)._targetInst?.pendingProps || {}

  const target = extendObject(
    {},
    event.target,
    {
      id: pendingProps.parentId || pendingProps.nativeID || '',
      dataset: collectDataset(pendingProps)
    }
  )

  return extendObject({}, event, {
    type,
    timeStamp: timestamp,
    currentTarget,
    target,
    detail: {
      x: pageX,
      y: pageY - navigationY
    },
    touches: touches.map((item) => {
      return {
        identifier: item.identifier,
        pageX: item.pageX,
        pageY: item.pageY - navigationY,
        clientX: item.pageX,
        clientY: item.pageY - navigationY
      }
    }),
    changedTouches: changedTouches.map((item) => {
      return {
        identifier: item.identifier,
        pageX: item.pageX,
        pageY: item.pageY - navigationY,
        clientX: item.pageX,
        clientY: item.pageY - navigationY
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
  {
    detail = {},
    layoutRef
  }: { detail?: Record<string, unknown>; layoutRef?: LayoutRef },
  props: Props = {}
) => {
  const targetInfo = extendObject({}, oe.target, {
    id: props.id || '',
    dataset: collectDataset(props),
    offsetLeft: layoutRef?.current?.offsetLeft || 0,
    offsetTop: layoutRef?.current?.offsetTop || 0
  })
  return extendObject({}, oe, {
    type,
    detail,
    target: targetInfo,
    persist: oe.persist,
    stopPropagation: oe.stopPropagation,
    preventDefault: oe.preventDefault
  })
}

function handleEmitEvent (
  name: string,
  e: ExtendedNativeTouchEvent,
  type: EventType,
  eventConfig: EventConfig
) {
  const { propsRef } = eventConfig
  const eventCfg = eventConfig[name]
  if (eventCfg) {
    if (eventCfg.hasCatch && name !== 'tap' && name !== 'longpress') {
      e.stopPropagation()
    }
    eventCfg[type].forEach((event) => {
      propsRef.current[event]?.(getTouchEvent(name, e, eventConfig))
    })
  }
}

function checkIsNeedPress (e: ExtendedNativeTouchEvent, type: 'bubble' | 'capture', ref: InnerRef) {
  const tapDetailInfo = ref.current.mpxPressInfo.detail || { x: 0, y: 0 }
  const currentPageX = e.nativeEvent.changedTouches[0].pageX
  const currentPageY = e.nativeEvent.changedTouches[0].pageY
  if (
    Math.abs(currentPageX - tapDetailInfo.x) > 3 ||
    Math.abs(currentPageY - tapDetailInfo.y) > 3
  ) {
    globalEventState.needPress = false
    ref.current.startTimer[type] && clearTimeout(ref.current.startTimer[type] as unknown as number)
    ref.current.startTimer[type] = null
  }
}

function shouldHandleTapEvent (e: ExtendedNativeTouchEvent, eventConfig: EventConfig) {
  const { identifier } = e.nativeEvent.changedTouches[0]
  return eventConfig.tap && globalEventState.identifier === identifier
}

function handleTouchstart (e: ExtendedNativeTouchEvent, type: EventType, eventConfig: EventConfig) {
  e.persist()
  const { innerRef } = eventConfig
  const touch = e.nativeEvent.changedTouches[0]
  const { identifier } = touch

  const isSingle = e.nativeEvent.touches.length <= 1

  if (isSingle) {
    // 仅在 touchstart 记录第一个单指触摸点
    globalEventState.identifier = identifier
    globalEventState.needPress = true
    innerRef.current.mpxPressInfo.detail = {
      x: touch.pageX,
      y: touch.pageY
    }
  }

  handleEmitEvent('touchstart', e, type, eventConfig)

  if (eventConfig.longpress) {
    // 只有单指触摸时才启动长按定时器
    if (isSingle) {
      if (e._stoppedEventTypes?.has('longpress')) {
        return
      }
      if (eventConfig.longpress.hasCatch) {
        e._stoppedEventTypes = e._stoppedEventTypes || new Set()
        e._stoppedEventTypes.add('longpress')
      }
      innerRef.current.startTimer[type] && clearTimeout(innerRef.current.startTimer[type] as unknown as number)
      innerRef.current.startTimer[type] = setTimeout(() => {
        globalEventState.needPress = false
        handleEmitEvent('longpress', e, type, eventConfig)
      }, 350)
    }
  }
}

function handleTouchmove (e: ExtendedNativeTouchEvent, type: EventType, eventConfig: EventConfig) {
  const { innerRef } = eventConfig
  handleEmitEvent('touchmove', e, type, eventConfig)
  if (shouldHandleTapEvent(e, eventConfig)) {
    checkIsNeedPress(e, type, innerRef)
  }
}

function handleTouchend (e: ExtendedNativeTouchEvent, type: EventType, eventConfig: EventConfig) {
  const { innerRef, disableTap } = eventConfig
  handleEmitEvent('touchend', e, type, eventConfig)
  innerRef.current.startTimer[type] && clearTimeout(innerRef.current.startTimer[type] as unknown as number)

  // 只有单指触摸结束时才触发 tap
  if (shouldHandleTapEvent(e, eventConfig)) {
    checkIsNeedPress(e, type, innerRef)
    if (!globalEventState.needPress || (type === 'bubble' && disableTap) || e._stoppedEventTypes?.has('tap')) {
      return
    }
    if (eventConfig.tap.hasCatch) {
      e._stoppedEventTypes = e._stoppedEventTypes || new Set()
      e._stoppedEventTypes.add('tap')
    }
    handleEmitEvent('tap', e, type, eventConfig)
  }
}

function handleTouchcancel (e: ExtendedNativeTouchEvent, type: EventType, eventConfig: EventConfig) {
  const { innerRef } = eventConfig
  handleEmitEvent('touchcancel', e, type, eventConfig)
  innerRef.current.startTimer[type] && clearTimeout(innerRef.current.startTimer[type] as unknown as number)
}

const touchHandlerMap: Record<string, TouchHandlerConfig> = {
  onTouchStart: {
    type: 'bubble',
    handler: handleTouchstart
  },
  onTouchMove: {
    type: 'bubble',
    handler: handleTouchmove
  },
  onTouchEnd: {
    type: 'bubble',
    handler: handleTouchend
  },
  onTouchCancel: {
    type: 'bubble',
    handler: handleTouchcancel
  },
  onTouchStartCapture: {
    type: 'capture',
    handler: handleTouchstart
  },
  onTouchMoveCapture: {
    type: 'capture',
    handler: handleTouchmove
  },
  onTouchEndCapture: {
    type: 'capture',
    handler: handleTouchend
  },
  onTouchCancelCapture: {
    type: 'capture',
    handler: handleTouchcancel
  }
}

function createTouchEventHandler (eventName: string, eventConfigRef: EventConfigRef) {
  const eventHandler = touchHandlerMap[eventName]
  return (e: ExtendedNativeTouchEvent) => {
    eventHandler.handler(e, eventHandler.type, eventConfigRef.current)
  }
}

const useInnerProps = (
  props: Props = {},
  userRemoveProps: RemoveProps = [],
  rawConfig?: RawConfig
) => {
  const innerRef: InnerRef = useRef({
    startTimer: {
      bubble: null,
      capture: null
    },
    mpxPressInfo: {
      detail: {
        x: 0,
        y: 0
      }
    }
  })
  const propsRef = useRef({})
  propsRef.current = props
  const navigation = useNavigation()
  const eventConfig: EventConfig = extendObject({
    layoutRef: {
      current: null
    },
    propsRef,
    innerRef,
    disableTap: false,
    navigation
  }, rawConfig)
  const eventConfigRef = useRef<EventConfig>(eventConfig)

  const restProps: Props = {}
  const eventNameMap: Record<string, boolean> = {}
  const userRemovePropsMap: Record<string, boolean> = {}
  let hashEventKey = ''

  userRemoveProps.forEach((key) => {
    userRemovePropsMap[key] = true
  })

  Object.keys(props).forEach((key) => {
    const eventMeta = eventConfigMap[key]

    if (eventMeta) {
      hashEventKey += eventMeta.bitFlag
      eventMeta.events.forEach((event) => {
        eventNameMap[event] = true
      })
      eventConfig[eventMeta.eventName] = eventConfig[eventMeta.eventName] || {
        bubble: [],
        capture: [],
        hasCatch: false
      }
      eventConfig[eventMeta.eventName][eventMeta.eventType].push(key)

      if (eventMeta.hasCatch) {
        eventConfig[eventMeta.eventName].hasCatch = true
      }
      return
    }

    if (!baseRemovePropsMap[key] && !userRemovePropsMap[key]) {
      restProps[key] = props[key]
    }
  })

  eventConfigRef.current = eventConfig

  const events = useMemo(() => {
    if (!hashEventKey) {
      return {}
    }

    const events: Record<string, (e: ExtendedNativeTouchEvent) => void> = {}

    Object.keys(eventNameMap).forEach((eventName) => {
      events[eventName] = createTouchEventHandler(eventName, eventConfigRef)
    })

    return events
  }, [hashEventKey])

  return extendObject(
    {},
    events,
    restProps
  )
}
export default useInnerProps
