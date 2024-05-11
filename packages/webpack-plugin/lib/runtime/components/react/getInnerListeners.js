import { useEffect, useRef } from 'react'
// import { PanResponder } from 'react-native'

const getDefaultEvent = (type = '', event = {}, props = {}) => {
  const nativeEvent = event.nativeEvent
  const {
    timestamp,
    pageX,
    pageY,
    touches = [],
    changedTouches = []
  } = nativeEvent
  const { id, offsetLeft, offsetTop } = props
  return {
    ...event,
    type,
    timeStamp: timestamp,
    target: {
      id: id || '',
      dataset: getDataSet(props),
      offsetLeft: offsetLeft || 0,
      offsetTop: offsetTop || 0
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
  e && e.persist && e.persist()
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

export const getCustomEvent = (type, oe, { detail = {}, target = {} }, props = {}) => {
  return extendEvent(oe, {
    type,
    detail: {
      ...(oe?.detail || {}),
      ...detail
    },
    target: {
      id: props.id || '',
      dataset: getDataSet(props),
      ...target
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
//         onTouchStart && onTouchStart(getDefaultEvent(evt))
//         ref.current.startTimestamp = evt.nativeEvent.timestamp
//       },
//       onPanResponderTerminationRequest: () => true,
//       onPanResponderMove: (evt) => {
//         const { onTouchMove } = ref.current.props
//         onTouchMove && onTouchMove(getDefaultEvent(evt))
//       },
//       onPanResponderRelease: (evt) => {
//         const { onTap, onLongTap, onTouchEnd } = ref.current.props
//         onTouchEnd && onTouchEnd(getDefaultEvent(evt))
//         const endTimestamp = evt.nativeEvent.timestamp
//         const gapTime = endTimestamp - ref.current.startTimestamp
//         if (gapTime <= 350) {
//           onTap && onTap(getDefaultEvent(evt))
//         } else {
//           onLongTap && onLongTap(getDefaultEvent(evt))
//         }
//       }
//     })
//   ).current
//   return {
//     ...panResponder.panHandlers
//   }
// }

const useInnerTouchable = props => {
  const { bindTap, catchTap, bindLongPress, catchLongPress, bindTouchStart, bindTouchMove, bindTouchEnd, catchTouchStart, catchTouchMove, catchTouchEnd } = props
  if (!bindTap && !catchTap && !bindLongPress && !catchLongPress && !bindTouchStart && !bindTouchMove && !bindTouchEnd && !catchTouchStart && !catchTouchMove && !catchTouchEnd) {
    return props
  }
  const ref = useRef({
    startTimer: null,
    needPress: true,
    mpxPressInfo: {},
    props: props
  })
  useEffect(() => {
    ref.current.props = props
  })

  function handleEmitEvent (events, type, oe) {
    events.forEach(event => {
      if (ref.current.props[event]) {
        const match = /^(catch|capture-catch):?(.*?)(?:\.(.*))?$/.exec(event)
        if (match) {
          oe.stopPropagation()
        }
        ref.current.props[event](getDefaultEvent(type, oe, ref.current.props))
      }
    })
  }
  const events = {
    onTouchStart: (e) => {
      e.persist()
      ref.current.startTimer = null
      ref.current.needPress = true
      const nativeEvent = e.nativeEvent
      ref.current.mpxPressInfo.detail = {
        x: nativeEvent.changedTouches[0].pageX,
        y: nativeEvent.changedTouches[0].pageY
      }
      handleEmitEvent(['catchTouchStart', 'bindTouchStart'], 'touchstart', e)
      if (ref.current.props.catchLongPress || ref.current.props.bindLongPress) {
        ref.current.startTimer = setTimeout(() => {
          ref.current.needPress = false
          handleEmitEvent(['catchLongPress', 'bindLongPress'], 'longpress', e)
        }, 350)
      }
    },
    onTouchMove: (e) => {
      const tapDetailInfo = ref.current.mpxPressInfo.detail || {}
      const nativeEvent = e.nativeEvent
      const currentPageX = nativeEvent.changedTouches[0].pageX
      const currentPageY = nativeEvent.changedTouches[0].pageY
      if (Math.abs(currentPageX - tapDetailInfo.x) > 1 || Math.abs(currentPageY - tapDetailInfo.y) > 1) {
        ref.current.needPress = false
        ref.current.startTimer && clearTimeout(ref.current.startTimer)
        ref.current.startTimer = null
      }
      handleEmitEvent(['catchTouchMove', 'bindTouchMove'], 'touchmove', e)
    },
    onTouchEnd: (e) => {
      ref.current.startTimer && clearTimeout(ref.current.startTimer)
      handleEmitEvent(['catchTouchEnd', 'bindTouchEnd'], 'touchend', e)
      if (ref.current.needPress) {
        handleEmitEvent(['catchTap', 'bindTap'], 'tap', e)
      }
    },
    onTouchCancel: (e) => {
      handleEmitEvent(['catchTouchCancel', 'bindTouchCancel'], 'touchcancel', e)
    }
  }
  const oe = ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture', 'onTouchCancelCapture']
  oe.forEach(event => {
    if (ref.current.props[event]) {
      events[event] = (e) => {
        ref.current.props[event]?.(e)
      }
    }
  })
  return events
}
export default useInnerTouchable
