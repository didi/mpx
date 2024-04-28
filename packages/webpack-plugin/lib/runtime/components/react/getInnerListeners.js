import { useEffect, useRef } from 'react'
import { PanResponder } from 'react-native'

const getDefaultEvent = event => {
  const nativeEvent = event.nativeEvent
  const {
    timestamp,
    pageX,
    pageY,
    touches = [],
    changedTouches = []
  } = nativeEvent
  return {
    type: 'tap',
    timeStamp: timestamp,
    target: {
      id: '',
      dataset: {}
    },
    currentTarget: {
      id: '',
      dataset: {}
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
    nativeEvent
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

export const getCustomEvent = (type, oe, { detail = {}, target = {} }) => {
  return extendEvent(oe, {
    type,
    detail: {
      ...(oe?.detail || {}),
      ...detail
    },
    target: {
      id: '',
      dataset: {},
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
  const { onTap, onLongTap, onLongPress, onTouchStart, onTouchMove, onTouchEnd } = props
  if (!onTap && !onLongTap && !onLongPress && !onTouchStart && !onTouchMove && !onTouchEnd) {
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
      if (ref.current.props.onTouchStart) {
        ref.current.props.onTouchStart(getDefaultEvent(e))
      }
      if (ref.current.props.onLongPress || ref.current.props.onLongTap) {
        ref.current.startTimer = setTimeout(() => {
          ref.current.needTap = false
          if (ref.current.props.onLongPress) {
            ref.current.props.onLongPress(getDefaultEvent(e))
          }
          if (ref.current.props.onLongTap) {
            ref.current.props.onLongTap(getDefaultEvent(e))
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
      if (ref.current.props.onTouchMove) {
        ref.current.props.onTouchMove(getDefaultEvent(e))
      }
    },
    onTouchEnd: (e) => {
      ref.current.startTimer && clearTimeout(ref.current.startTimer)
      if (ref.current.props.onTouchEnd) {
        ref.current.props.onTouchEnd(getDefaultEvent(e))
      }
      if (ref.current.props.onTap && ref.current.needTap) {
        ref.current.props.onTap(getDefaultEvent(e))
      }
    }
  }
  return events
}

export default useInnerTouchable
