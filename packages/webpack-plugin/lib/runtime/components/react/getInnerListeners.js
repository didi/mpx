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
  const eventProps = [
    'bindtap',
    'bindlongpress',
    'bindtouchstart',
    'bindtouchmove',
    'bindtouchend',
    'bindtouchcancel',
    'catchtap',
    'catchlongpress',
    'catchtouchstart',
    'catchtouchmove',
    'catchtouchend',
    'catchtouchcancel',
    'capture-bindtap',
    'capture-bindlongpress',
    'capture-bindtouchstart',
    'capture-bindtouchmove',
    'capture-bindtouchend',
    'capture-bindtouchcancel',
    'capture-catchtap',
    'capture-catchlongpress',
    'capture-catchtouchstart',
    'capture-catchtouchmove',
    'capture-catchtouchend',
    'capture-catchtouchcancel'
  ]
  const hasEventProps = eventProps.some(prop => props[prop])

  if (!hasEventProps) {
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
  function handleTouchstart (e, touchEvent, pressEvent) {
    e.persist()
    ref.current.startTimer = null
    ref.current.needPress = true
    const nativeEvent = e.nativeEvent
    ref.current.mpxPressInfo.detail = {
      x: nativeEvent.changedTouches[0].pageX,
      y: nativeEvent.changedTouches[0].pageY
    }
    handleEmitEvent(touchEvent, 'touchstart', e)
    if (ref.current.props.catchlongpress || ref.current.props.bindlongpress) {
      ref.current.startTimer = setTimeout(() => {
        ref.current.needPress = false
        handleEmitEvent(pressEvent, 'longpress', e)
      }, 350)
    }
  }

  function handleTouchmove (e, touchEvent) {
    const tapDetailInfo = ref.current.mpxPressInfo.detail || {}
    const nativeEvent = e.nativeEvent
    const currentPageX = nativeEvent.changedTouches[0].pageX
    const currentPageY = nativeEvent.changedTouches[0].pageY
    if (Math.abs(currentPageX - tapDetailInfo.x) > 1 || Math.abs(currentPageY - tapDetailInfo.y) > 1) {
      ref.current.needPress = false
      ref.current.startTimer && clearTimeout(ref.current.startTimer)
      ref.current.startTimer = null
    }
    handleEmitEvent(touchEvent, 'touchmove', e)
  }

  function handleTouchend (e, touchEvent, tapEvent) {
    ref.current.startTimer && clearTimeout(ref.current.startTimer)
    handleEmitEvent(touchEvent, 'touchend', e)
    if (ref.current.needPress) {
      handleEmitEvent(tapEvent, 'tap', e)
    }
  }

  function handleTouchcancel (e, touchEvent) {
    handleEmitEvent(touchEvent, 'touchcancel', e)
  }

  const events = {
    onTouchStart: (e) => {
      e.persist()
      handleTouchstart(e, ['catchtouchstart', 'bindtouchstart'], ['catchlongpress', 'bindlongpress'])
      // ref.current.startTimer = null
      // ref.current.needPress = true
      // const nativeEvent = e.nativeEvent
      // ref.current.mpxPressInfo.detail = {
      //   x: nativeEvent.changedTouches[0].pageX,
      //   y: nativeEvent.changedTouches[0].pageY
      // }
      // handleEmitEvent(['catchtouchstart', 'bindtouchstart'], 'touchstart', e)
      // if (ref.current.props.catchlongpress || ref.current.props.bindlongpress) {
      //   ref.current.startTimer = setTimeout(() => {
      //     ref.current.needPress = false
      //     handleEmitEvent(['catchlongpress', 'bindlongpress'], 'longpress', e)
      //   }, 350)
      // }
    },
    onTouchMove: (e) => {
      handleTouchmove(e, ['catchtouchmove', 'bindtouchmove'])
      // const tapDetailInfo = ref.current.mpxPressInfo.detail || {}
      // const nativeEvent = e.nativeEvent
      // const currentPageX = nativeEvent.changedTouches[0].pageX
      // const currentPageY = nativeEvent.changedTouches[0].pageY
      // if (Math.abs(currentPageX - tapDetailInfo.x) > 1 || Math.abs(currentPageY - tapDetailInfo.y) > 1) {
      //   ref.current.needPress = false
      //   ref.current.startTimer && clearTimeout(ref.current.startTimer)
      //   ref.current.startTimer = null
      // }
      // handleEmitEvent(['catchtouchmove', 'bindtouchmove'], 'touchmove', e)
    },
    onTouchEnd: (e) => {
      handleTouchend(e, ['catchtouchend', 'bindtouchend'], ['catchtap', 'bindtap'])
      // ref.current.startTimer && clearTimeout(ref.current.startTimer)
      // handleEmitEvent(['catchtouchend', 'bindtouchend'], 'touchend', e)
      // if (ref.current.needPress) {
      //   handleEmitEvent(['catchtap', 'bindtap'], 'tap', e)
      // }
    },
    onTouchCancel: (e) => {
      handleTouchcancel(e, ['catchtouchcancel', 'bindtouchcancel'])
      // handleEmitEvent(['catchtouchcancel', 'bindtouchcancel'], 'touchcancel', e)
    },
    onTouchStartCapture: (e) => {
      e.persist()
      handleTouchstart(e, ['capture-catchtouchstart', 'capture-bindtouchstart'], ['capture-catchlongpress', 'capture-bindlongpress'])
    },
    onTouchMoveCapture: (e) => {
      handleTouchmove(e, ['capture-catchtouchmove', 'capture-bindtouchmove'])
    },
    onTouchEndCapture: (e) => {
      handleTouchend(e, ['capture-catchtouchend', 'capture-bindtouchend'], ['capture-catchtap', 'capture-bindtap'])
    },
    onTouchCancelCapture: (e) => {
      handleTouchcancel(e, ['capture-catchtouchcancel', 'capture-bindtouchcancel'])
    }
  }
  return events
}
export default useInnerTouchable
