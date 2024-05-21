import { useEffect, useRef } from 'react'
import { omit } from './utils'
import eventConfigList from './event.config'
// import { PanResponder } from 'react-native'

const getTouchEvent = (type = '', event = {}, props = {}, config) => {
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
      id: id || '',
      dataset: getDataSet(props),
      offsetLeft: layoutRef.current?.offsetLeft || 0,
      offsetTop: layoutRef.current?.offsetTop || 0
    },
    detail: {
      ...(event.detail || {}),
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

export const extendEvent = (e = {}, extendObj = {}) => {
  Object.keys(extendObj).forEach(key => {
    Object.defineProperty(e, key, {
      value: extendObj[key],
      enumerable: true,
      configurable: true,
      writable: true
    })
  })
  return e
}

export const getDataSet = (props) => {
  const result = {}

  for (const key in props) {
    if (key.indexOf('data-') === 0) {
      const newKey = key.substr(5) // 去掉 'data-' 前缀
      result[newKey] = props[key]
    }
  }

  return result
}

export const getCustomEvent = (type, oe = {}, { detail = {}, layoutRef = {} }, props = {}) => {
  return extendEvent(oe, {
    type,
    detail: {
      ...(oe.detail || {}),
      ...detail
    },
    target: {
      id: props.id || '',
      dataset: getDataSet(props),
      offsetLeft: layoutRef.current?.offsetLeft || 0,
      offsetTop: layoutRef.current?.offsetTop || 0
    }
  })
}

// const useInnerTouchable = props => {
//   const { onTap, onLongTap, onTouchStart, onTouchMove, onTouchEnd } = props
//   if (!onTap && !onLongTap && !onTouchStart && !onTouchMove && !onTouchEnd) {
//     return props
//   }

//   // eslint-disable-next-line react-hooks/rules-of-hooks
//   const ref = useRef({
//     startTimestamp: 0,
//     props: props
//   })
//   // eslint-disable-next-line react-hooks/rules-of-hooks
//   useEffect(() => {
//     ref.current.props = props
//   })
//   // eslint-disable-next-line react-hooks/rules-of-hooks
//   const panResponder = useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: () => {
//         const { onTap, onLongTap, onTouchStart, onTouchMove, onTouchEnd } =
//           ref.current.props
//         return !!(
//           onTap ||
//           onLongTap ||
//           onTouchStart ||
//           onTouchMove ||
//           onTouchEnd
//         )
//       },
//       onShouldBlockNativeResponder: () => false,
//       onPanResponderGrant: evt => {
//         const { onTouchStart } = ref.current.props
//         onTouchStart && onTouchStart(getTouchEvent(evt))
//         ref.current.startTimestamp = evt.nativeEvent.timestamp
//       },
//       onPanResponderTerminationRequest: () => true,
//       onPanResponderMove: (evt) => {
//         const { onTouchMove } = ref.current.props
//         onTouchMove && onTouchMove(getTouchEvent(evt))
//       },
//       onPanResponderRelease: (evt) => {
//         const { onTap, onLongTap, onTouchEnd } = ref.current.props
//         onTouchEnd && onTouchEnd(getTouchEvent(evt))
//         const endTimestamp = evt.nativeEvent.timestamp
//         const gapTime = endTimestamp - ref.current.startTimestamp
//         if (gapTime <= 350) {
//           onTap && onTap(getTouchEvent(evt))
//         } else {
//           onLongTap && onLongTap(getTouchEvent(evt))
//         }
//       }
//     })
//   ).current
//   return {
//     ...panResponder.panHandlers
//   }
// }

const useInnerProps = (props = {}, additionalProps = {}, removeProps = [], config = {}) => {
  const ref = useRef({
    startTimer: null,
    needPress: true,
    mpxPressInfo: {},
    props: { ...props, ...additionalProps },
    config,
    eventConfig: []
  })
  useEffect(() => {
    ref.current = {
      startTimer: null,
      needPress: true,
      mpxPressInfo: {},
      props: { ...props, ...additionalProps },
      config,
      eventConfig: []
    }
  })

  eventConfigList.forEach(item => {
    for (const key in item) {
      if (ref.current.props[key]) {
        ref.current.eventConfig.push({ [key]: item[key] })
      }
    }
  })

  if (!ref.current.eventConfig.length || !config.touchable) {
    return omit(ref.current.props, removeProps)
  }

  function handleEmitEvent (events, type, oe) {
    events.forEach(event => {
      if (ref.current.props[event]) {
        const match = /^(catch|capture-catch):?(.*?)(?:\.(.*))?$/.exec(event)
        if (match) {
          oe.stopPropagation()
        }
        ref.current.props[event](getTouchEvent(type, oe, ref.current.props, ref.current.config))
      }
    })
  }
  function handleTouchstart (e, type) {
    e.persist()
    const bubbleTouchEvent = ['catchtouchstart', 'bindtouchstart']
    const bubblePressEvent = ['catchlongpress', 'bindlongpress']
    const captureTouchEvent = ['capture-catchtouchstart', 'capture-bindtouchstart']
    const capturePressEvent = ['capture-catchlongpress', 'capture-bindlongpress']
    ref.current.startTimer = null
    ref.current.needPress = true
    const nativeEvent = e.nativeEvent
    ref.current.mpxPressInfo.detail = {
      x: nativeEvent.changedTouches[0].pageX,
      y: nativeEvent.changedTouches[0].pageY
    }
    const currentTouchEvent = type === 'bubble' ? bubbleTouchEvent : captureTouchEvent
    const currentPressEvent = type === 'bubble' ? bubblePressEvent : capturePressEvent
    handleEmitEvent(currentTouchEvent, 'touchstart', e)
    const { catchlongpress, bindlongpress, 'capture-catchlongpress': captureCatchlongpress, 'capture-bindlongpress': captureBindlongpress } = ref.current.props
    if (catchlongpress || bindlongpress || captureCatchlongpress || captureBindlongpress) {
      ref.current.startTimer = setTimeout(() => {
        if (ref.current.startTimer) {
          ref.current.needPress = false
          handleEmitEvent(currentPressEvent, 'longpress', e)
        }
      }, 350)
    }
  }

  function handleTouchmove (e, type) {
    const bubbleTouchEvent = ['catchtouchmove', 'bindtouchmove']
    const captureTouchEvent = ['capture-catchtouchmove', 'capture-bindtouchmove']
    const tapDetailInfo = ref.current.mpxPressInfo.detail || {}
    const nativeEvent = e.nativeEvent
    const currentPageX = nativeEvent.changedTouches[0].pageX
    const currentPageY = nativeEvent.changedTouches[0].pageY
    const currentTouchEvent = type === 'bubble' ? bubbleTouchEvent : captureTouchEvent
    if (Math.abs(currentPageX - tapDetailInfo.x) > 1 || Math.abs(currentPageY - tapDetailInfo.y) > 1) {
      ref.current.needPress = false
      ref.current.startTimer && clearTimeout(ref.current.startTimer)
      ref.current.startTimer = null
    }
    handleEmitEvent(currentTouchEvent, 'touchmove', e)
  }

  function handleTouchend (e, type) {
    const bubbleTouchEvent = ['catchtouchend', 'bindtouchend']
    const bubbleTapEvent = ['catchtap', 'bindtap']
    const captureTouchEvent = ['capture-catchtouchend', 'capture-bindtouchend']
    const captureTapEvent = ['capture-catchtap', 'capture-bindtap']
    const currentTouchEvent = type === 'bubble' ? bubbleTouchEvent : captureTouchEvent
    const currentTapEvent = type === 'bubble' ? bubbleTapEvent : captureTapEvent
    ref.current.startTimer && clearTimeout(ref.current.startTimer)
    ref.current.startTimer = null
    handleEmitEvent(currentTouchEvent, 'touchend', e)
    if (ref.current.needPress) {
      handleEmitEvent(currentTapEvent, 'tap', e)
    }
  }

  function handleTouchcancel (e, type) {
    const bubbleTouchEvent = ['catchtouchcancel', 'bindtouchcancel']
    const captureTouchEvent = ['capture-catchtouchcancel', 'capture-bindtouchcancel']
    const currentTouchEvent = type === 'bubble' ? bubbleTouchEvent : captureTouchEvent
    handleEmitEvent(currentTouchEvent, 'touchcancel', e)
  }

  function addTouchEvents () {
    const transformedEventKeys = []
    ref.current.eventConfig.forEach(item => {
      transformedEventKeys.push(...(Object.values(item)[0] || []))
    })
    const finalEventKeys = [...new Set(transformedEventKeys)]
    const events = {}
    if (finalEventKeys.includes('onTouchStart')) {
      events.onTouchStart = (e) => {
        handleTouchstart(e, 'bubble')
      }
    }
    if (finalEventKeys.includes('onTouchMove')) {
      events.onTouchMove = (e) => {
        handleTouchmove(e, 'bubble')
      }
    }
    if (finalEventKeys.includes('onTouchEnd')) {
      events.onTouchEnd = (e) => {
        handleTouchend(e, 'bubble')
      }
    }
    if (finalEventKeys.includes('onTouchCancel')) {
      events.onTouchCancel = (e) => {
        handleTouchcancel(e, 'bubble')
      }
    }
    if (finalEventKeys.includes('onTouchStartCapture')) {
      events.onTouchStartCapture = (e) => {
        handleTouchstart(e, 'capture')
      }
    }
    if (finalEventKeys.includes('onTouchMoveCapture')) {
      events.onTouchMoveCapture = (e) => {
        handleTouchmove(e, 'capture')
      }
    }
    if (finalEventKeys.includes('onTouchEndCapture')) {
      events.onTouchEndCapture = (e) => {
        handleTouchend(e, 'capture')
      }
    }
    if (finalEventKeys.includes('onTouchCancelCapture')) {
      events.onTouchCancelCapture = (e) => {
        handleTouchcancel(e, 'capture')
      }
    }
    return events
  }

  const touchEvents = addTouchEvents()

  const rawEventKeys = ref.current.eventConfig.map(item => Object.keys(item)[0])

  return {
    ...touchEvents,
    ...omit(ref.current.props, [...rawEventKeys, ...removeProps])
  }
}
export default useInnerProps
