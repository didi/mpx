import { useEffect, useRef } from 'react'
import { PanResponder } from 'react-native'

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
  const { tap, longTap, longPress, touchstart, touchmove, touchend, catchTouchstart, catchTouchmove, catchTouchend, catchTap, catchLongpress, catchLongtap } = props
  if (!tap && !longTap && !longPress && !touchstart && !touchmove && !touchend && !catchTouchstart && !catchTouchmove && !catchTouchend && !catchTap && !catchLongpress && !catchLongtap) {
    return props
  }
  const ref = useRef({
    startTimer: null,
    needTap: true,
    mpxTapInfo: {},
    props: props
  })
  useEffect(() => {
    ref.current.props = props
  })
  const events = {
    onTouchStart: (e) => {
      e.persist()
      ref.current.startTimer = null
      ref.current.needTap = true
      const nativeEvent = e.nativeEvent
      ref.current.mpxTapInfo.detail = {
        x: nativeEvent.changedTouches[0].pageX,
        y: nativeEvent.changedTouches[0].pageY
      }
      if (ref.current.props.catchTouchstart) {
        e.stopPropagation()
        ref.current.props.catchTouchstart(getDefaultEvent('touchstart', e, ref.current.props))
      }
      if (ref.current.props.touchstart) {
        ref.current.props.touchstart(getDefaultEvent('touchstart', e, ref.current.props))
      }
      if (ref.current.props.catchLongtap || ref.current.props.catchLongpress || ref.current.props.longPress || ref.current.props.longTap) {
        ref.current.startTimer = setTimeout(() => {
          ref.current.needTap = false
          if (ref.current.props.catchLongpress) {
            e.stopPropagation()
            ref.current.props.catchLongpress(getDefaultEvent('longpress', e, ref.current.props))
          }
          if (ref.current.props.longPress) {
            ref.current.props.onLongPress(getDefaultEvent('longpress', e, ref.current.props))
          }
          if (ref.current.props.catchLongtap) {
            e.stopPropagation()
            ref.current.props.catchLongtap(getDefaultEvent('longtap', e, ref.current.props))
          }
          if (ref.current.props.longTap) {
            ref.current.props.longTap(getDefaultEvent('longtap', e, ref.current.props))
          }
        }, 350)
      }
    },
    onTouchMove: (e) => {
      const tapDetailInfo = ref.current.mpxTapInfo.detail || {}
      const nativeEvent = e.nativeEvent
      const currentPageX = nativeEvent.changedTouches[0].pageX
      const currentPageY = nativeEvent.changedTouches[0].pageY
      if (Math.abs(currentPageX - tapDetailInfo.x) > 1 || Math.abs(currentPageY - tapDetailInfo.y) > 1) {
        ref.current.needTap = false
        ref.current.startTimer && clearTimeout(ref.current.startTimer)
        ref.current.startTimer = null
      }
      if (ref.current.props.catchTouchmove) {
        e.stopPropagation()
        ref.current.props.catchTouchmove(getDefaultEvent('touchmove', e, ref.current.props))
      }
      if (ref.current.props.touchmove) {
        ref.current.props.touchmove(getDefaultEvent('touchmove', e, ref.current.props))
      }
    },
    onTouchEnd: (e) => {
      ref.current.startTimer && clearTimeout(ref.current.startTimer)
      if (ref.current.props.catchTouchend) {
        e.stopPropagation()
        ref.current.props.catchTouchend(getDefaultEvent('touchend', e, ref.current.props))
      } else if (ref.current.props.touchend) {
        ref.current.props.touchend(getDefaultEvent('touchend', e, ref.current.props))
      }
      if ((ref.current.props.tap || ref.current.props.catchTap) && ref.current.needTap) {
        if (ref.current.props.catchTap) {
          e.stopPropagation()
          ref.current.props.catchTap(getDefaultEvent('tap', e, ref.current.props))
        }
        if (ref.current.props.tap) {
          ref.current.props.tap(getDefaultEvent('tap', e, ref.current.props))
        }
      }
    }
  }
  const oe = ['onTouchCancel', 'onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture', 'onTouchCancelCapture']
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
