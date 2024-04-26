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

export const extendEvent = (e, extendObj = {}) => {
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
      ...oe.detail,
      ...detail
    },
    target: {
      id: '',
      dataset: {},
      ...target
    }
  })
}

const useInnerTouchable = props => {
  const { onTap, onLongTap, onTouchStart, onTouchMove, onTouchEnd } = props
  if (!onTap && !onLongTap && !onTouchStart && !onTouchMove && !onTouchEnd) {
    return props
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const ref = useRef({
    startTimestamp: 0,
    props: props
  })
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    ref.current.props = props
  })
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        const { onTap, onLongTap, onTouchStart, onTouchMove, onTouchEnd } =
          ref.current.props
        return !!(
          onTap ||
          onLongTap ||
          onTouchStart ||
          onTouchMove ||
          onTouchEnd
        )
      },
      onShouldBlockNativeResponder: () => false,
      onPanResponderGrant: evt => {
        const { onTouchStart } = ref.current.props
        onTouchStart && onTouchStart(getDefaultEvent(evt))
        ref.current.startTimestamp = evt.nativeEvent.timestamp
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderMove: (evt) => {
        const { onTouchMove } = ref.current.props
        onTouchMove && onTouchMove(getDefaultEvent(evt))
      },
      onPanResponderRelease: (evt) => {
        const { onTap, onLongTap, onTouchEnd } = ref.current.props
        onTouchEnd && onTouchEnd(getDefaultEvent(evt))
        const endTimestamp = evt.nativeEvent.timestamp
        const gapTime = endTimestamp - ref.current.startTimestamp
        if (gapTime <= 350) {
          onTap && onTap(getDefaultEvent(evt))
        } else {
          onLongTap && onLongTap(getDefaultEvent(evt))
        }
      }
    })
  ).current
  return {
    ...panResponder.panHandlers
  }
}
export default useInnerTouchable
