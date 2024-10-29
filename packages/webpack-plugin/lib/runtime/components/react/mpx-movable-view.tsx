/**
 * ✔ direction
 * ✘ inertia
 * ✘ out-of-bounds
 * ✔ x
 * ✔ y
 * ✘ damping
 * ✔ friction
 * ✔ disabled
 * ✔ scale
 * ✔ scale-min
 * ✔ scale-max
 * ✔ scale-value
 * ✘ animation
 * ✔ bindchange
 * ✔ bindscale
 * ✔ htouchmove
 * ✔ vtouchmove
 */
import { useRef, useEffect, forwardRef, ReactNode, useContext, useState, useMemo } from 'react'
import { StyleSheet, Animated, NativeSyntheticEvent, PanResponder, View } from 'react-native'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { MovableAreaContext } from './context'

interface MovableViewProps {
  children: ReactNode;
  style?: Record<string, any>;
  direction: 'all' | 'vertical' | 'horizontal' | 'none';
  x?: string | number;
  y?: string | number;
  scale?: boolean;
  disabled?: boolean;
  friction?: number;
  'scale-value'?: number;
  'scale-min'?: number;
  'scale-max'?: number;
  bindchange?: (event: unknown) => void;
  bindscale?: (event: unknown) => void;
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  catchtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindhtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindvtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  catchhtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  catchvtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
}
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0
  }
})

const _MovableView = forwardRef<HandlerRef<View, MovableViewProps>, MovableViewProps>((props: MovableViewProps, ref): JSX.Element => {
  const {
    children,
    friction = 7,
    scale = false,
    direction = 'none',
    x = 0,
    y = 0,
    style = {},
    'scale-min': scaleMin = 0.1,
    'scale-max': scaleMax = 10,
    'scale-value': originScaleValue = 1,
    bindscale,
    bindchange
  } = props

  const pan = useRef<any>(new Animated.ValueXY())
  const scaleValue = useRef<any>(new Animated.Value(1))
  const [transformOrigin, setTransformOrigin] = useState('0% 0%')

  const propsRef = useRef<any>({})
  const layoutRef = useRef<any>({})

  const MovableAreaLayout = useContext(MovableAreaContext)

  const movablePosition = useRef({
    x: Number(x),
    y: Number(y)
  })

  const { nodeRef } = useNodesRef(props, ref, {
    defaultStyle: styles.container
  })

  let panResponder: any = {}

  const isFirstTouch = useRef<boolean>(true)
  const touchEvent = useRef<string>('')
  const initialDistance = useRef<number>(0)

  propsRef.current = props

  useEffect(() => {
    if (scale && (scaleValue.current._value !== originScaleValue)) {
      const clampedScale = Math.min(scaleMax, Math.max(scaleMin, originScaleValue))
      Animated.spring(scaleValue.current, {
        toValue: clampedScale,
        friction,
        useNativeDriver: false
      }).start(() => {
        bindscale && bindscale(getCustomEvent('scale', {}, {
          detail: {
            x: pan.current.x._value,
            y: pan.current.y._value,
            scale: clampedScale
          },
          layoutRef
        }, props)
        )
      })
    }
  }, [originScaleValue])

  useEffect(() => {
    if (movablePosition.current.x !== Number(x) || movablePosition.current.y !== Number(y)) {
      const { x: newX, y: newY } = checkBoundaryPosition({
        clampedScale: scaleValue.current._value,
        width: layoutRef.current.width,
        height: layoutRef.current.height,
        positionX: Number(x),
        positionY: Number(y)
      })
      movablePosition.current = { x: newX, y: newY }
      Animated.spring(pan.current, {
        toValue: { x: newX, y: newY },
        useNativeDriver: false,
        friction
      }).start(() => {
        bindchange &&
          bindchange(
            getCustomEvent('change', {}, {
              detail: {
                x: newX,
                y: newY,
                source: ''
              },
              layoutRef
            }, props)
          )
      })
    }
  }, [x, y])

  const handlePanReleaseOrTerminate = () => {
    pan.current.flattenOffset()
    isFirstTouch.current = true
    initialDistance.current = 0
    const { x, y } = checkBoundaryPosition({
      clampedScale: scaleValue.current._value,
      width: layoutRef.current.width,
      height: layoutRef.current.height,
      positionX: pan.current.x._value,
      positionY: pan.current.y._value
    })
    movablePosition.current = {
      x,
      y
    }
    const needChange = x !== pan.current.x._value || y !== pan.current.y._value

    Animated.spring(pan.current, {
      toValue: { x, y },
      friction: 7,
      useNativeDriver: false
    }).start(() => {
      if (needChange) {
        bindchange && bindchange(
          getCustomEvent('change', {}, {
            detail: {
              x,
              y,
              source: 'out-of-bounds'
            },
            layoutRef
          }, propsRef.current)
        )
      }
    })
  }

  panResponder = useMemo(() => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: () => !propsRef.current.disabled,
      onMoveShouldSetPanResponderCapture: () => !propsRef.current.disabled,
      onPanResponderGrant: (e, gestureState) => {
        if (gestureState.numberActiveTouches === 1) {
          setTransformOrigin('0% 0%')
          pan.current.setOffset({
            x: direction === 'all' || direction === 'horizontal' ? pan.current.x._value : 0,
            y: direction === 'all' || direction === 'vertical' ? pan.current.y._value : 0
          })
          pan.current.setValue({ x: 0, y: 0 })
        } else {
          initialDistance.current = 0
          setTransformOrigin('50% 50%')
        }
      },
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.numberActiveTouches === 2 && scale) {
          setTransformOrigin('50% 50%')
          const touch1 = e.nativeEvent.touches[0]
          const touch2 = e.nativeEvent.touches[1]
          const currentTouchDistance = Math.sqrt(
            Math.pow(touch1.pageX - touch2.pageX, 2) + Math.pow(touch1.pageY - touch2.pageY, 2)
          )

          if (!initialDistance.current) {
            initialDistance.current = currentTouchDistance
          } else {
            const newScale = currentTouchDistance / initialDistance.current
            const clampedScale = Math.min(scaleMax, Math.max(scaleMin, newScale))

            Animated.spring(scaleValue.current, {
              toValue: clampedScale,
              friction: 7,
              useNativeDriver: false
            }).start()
            bindscale && bindscale(getCustomEvent('scale', e, {
              detail: {
                x: pan.current.x._value,
                y: pan.current.y._value,
                scale: clampedScale
              },
              layoutRef
            }, propsRef.current))
          }
        } else if (gestureState.numberActiveTouches === 1) {
          if (initialDistance.current) {
            return // Skip processing if it's switching from a double touch
          }
          setTransformOrigin('0% 0%')
          if (isFirstTouch.current) {
            touchEvent.current = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) ? 'htouchmove' : 'vtouchmove'
            isFirstTouch.current = false
          }
          Animated.event(
            [
              null,
              {
                dx: direction === 'all' || direction === 'horizontal' ? pan.current.x : new Animated.Value(0),
                dy: direction === 'all' || direction === 'vertical' ? pan.current.y : new Animated.Value(0)
              }
            ],
            {
              useNativeDriver: false
            }
          )(e, gestureState)

          movablePosition.current = {
            x: pan.current.x.__getValue(),
            y: pan.current.y.__getValue()
          }
          bindchange && bindchange(
            getCustomEvent('change', e, {
              detail: {
                x: movablePosition.current.x,
                y: movablePosition.current.y,
                source: 'touch'
              },
              layoutRef
            }, propsRef.current)
          )
        }
      },
      onPanResponderRelease: () => {
        handlePanReleaseOrTerminate()
      },
      onPanResponderTerminate: () => {
        handlePanReleaseOrTerminate()
      }
    })
  }, [MovableAreaLayout.width, MovableAreaLayout.height])

  const onLayout = () => {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft: 0, offsetTop: 0 }
      const clampedScale = Math.min(scaleMax, Math.max(scaleMin, originScaleValue))
      const { x: newX, y: nexY } = checkBoundaryPosition({
        clampedScale,
        width,
        height,
        positionX: movablePosition.current.x,
        positionY: movablePosition.current.y
      })

      Animated.spring(pan.current, {
        toValue: { x: newX, y: nexY },
        useNativeDriver: false,
        friction
      }).start(() => {
        movablePosition.current = { x: newX, y: nexY }
        bindchange &&
          bindchange(
            getCustomEvent('change', {}, {
              detail: {
                x: newX,
                y: nexY,
                source: ''
              },
              layoutRef
            }, props)
          )
      })
    })
  }

  const onTouchMove = (e: NativeSyntheticEvent<TouchEvent>) => {
    const { bindhtouchmove, bindvtouchmove, bindtouchmove } = props
    if (touchEvent.current === 'htouchmove') {
      bindhtouchmove && bindhtouchmove(e)
    } else if (touchEvent.current === 'vtouchmove') {
      bindvtouchmove && bindvtouchmove(e)
    }
    bindtouchmove && bindtouchmove(e)
  }

  const onCatchTouchMove = (e: NativeSyntheticEvent<TouchEvent>) => {
    const { catchhtouchmove, catchvtouchmove, catchtouchmove } = props
    if (touchEvent.current === 'htouchmove') {
      catchhtouchmove && catchhtouchmove(e)
    } else if (touchEvent.current === 'vtouchmove') {
      catchvtouchmove && catchvtouchmove(e)
    }
    catchtouchmove && catchtouchmove(e)
  }

  const checkBoundaryPosition = ({ clampedScale, width, height, positionX, positionY }: { clampedScale: number; width: number; height: number; positionX: number; positionY: number }) => {
    // Calculate scaled element size
    const scaledWidth = width * clampedScale
    const scaledHeight = height * clampedScale

    // Calculate the boundary limits
    let x = positionX
    let y = positionY

    // Correct y coordinate
    if (scaledHeight > MovableAreaLayout.height) {
      if (y >= 0) {
        y = 0
      } else if (y < MovableAreaLayout.height - scaledHeight) {
        y = MovableAreaLayout.height - scaledHeight
      }
    } else {
      if (y < 0) {
        y = 0
      } else if (y > MovableAreaLayout.height - scaledHeight) {
        y = MovableAreaLayout.height - scaledHeight
      }
    }
    // Correct x coordinate
    if (scaledWidth > MovableAreaLayout.width) {
      if (x >= 0) {
        x = 0
      } else if (x < MovableAreaLayout.width - scaledWidth) {
        x = MovableAreaLayout.width - scaledWidth
      }
    } else {
      if (x < 0) {
        x = 0
      } else if (x > MovableAreaLayout.width - scaledWidth) {
        x = MovableAreaLayout.width - scaledWidth
      }
    }

    return {
      x,
      y
    }
  }

  const [translateX, translateY] = [pan.current.x, pan.current.y]

  const transformStyle = { transform: [{ translateX }, { translateY }, { scale: scaleValue.current }], transformOrigin: transformOrigin }

  const hasTouchmove = () => !!props.bindhtouchmove || !!props.bindvtouchmove || !!props.bindtouchmove

  const hasCatchTouchmove = () => !!props.catchhtouchmove || !!props.catchvtouchmove || !!props.catchtouchmove

  const innerProps = useInnerProps(props, {
    additionalProps: {
      ref: nodeRef,
      ...panResponder.panHandlers,
      onLayout,
      ...(hasTouchmove() ? { bindtouchmove: onTouchMove } : {}),
      ...(hasCatchTouchmove() ? { catchtouchmove: onCatchTouchMove } : {})
    },
    removeProps: [
      'children',
      'style',
      'direction',
      'x',
      'y',
      'scale',
      'disabled',
      'scale-value',
      'scale-min',
      'scale-max',
      'bindchange',
      'bindscale',
      'htouchmove',
      'vtouchmove'
    ],
    config: {
      layoutRef
    }
  })

  return (
    <Animated.View
      {...innerProps}
      style={{
        ...styles.container,
        ...style,
        ...transformStyle
      }}
    >
      {children}
    </Animated.View>
  )
})

_MovableView.displayName = 'mpx-movable-view'

export default _MovableView
