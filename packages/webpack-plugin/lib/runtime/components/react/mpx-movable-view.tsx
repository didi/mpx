/**
 * ✔ direction
 * ✘ inertia
 * ✘ out-of-bounds
 * ✔ x
 * ✔ y
 * ✔ damping
 * ✔ friction
 * ✔ disabled
 * ✔ scale
 * ✔ scale-min
 * ✔ scale-max
 * ✘ animation
 * ✔ bindchange
 * ✔ bindscale
 * ✔ htouchmove
 * ✔ vtouchmove
 */
import { useState, useRef, useEffect, forwardRef, ReactNode, useContext } from 'react';
import { StyleSheet, Animated, NativeSyntheticEvent, PanResponder } from 'react-native';
import useInnerProps, { getCustomEvent } from './getInnerListeners';
import { MovableAreaContext } from './context'

interface MovableViewProps {
  children: ReactNode;
  style?: Record<string, any>;
  direction: 'all' | 'vertical' | 'horizontal' | 'none';
  x?: string | number;
  y?: string | number;
  scale?: boolean;
  disabled?: boolean;
  damping?: number;
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
    top: 0,
  },
})

const MovableView = forwardRef<HandlerRef<View, MovableViewProps>, MovableViewProps>((props: MovableViewProps, ref): JSX.Element => {
  const {
    children,
    friction = 2,
    damping = 20,
    scale = false,
    x = 0,
    y = 0,
    'scale-min': scaleMin = 0.1,
    'scale-max': scaleMax = 10,
    bindscale,
    bindchange
  } = props

  const [pan] = useState<any>(new Animated.ValueXY());
  const [baseScale] = useState(() => new Animated.Value(1));
  const [scaleValue] = useState(() => new Animated.Value(1));

  const layoutRef = useRef<any>({})
  const [direction, setDirection] = useState('none');
  const [disabled, setDisabled] = useState(false);
  const nodeRef = useRef(null)
  let isFirstTouch = true
  let touchEvent = ''
  let initialDistance = 0;

  const MovableAreaLayout = useContext(MovableAreaContext)
  const panResponder: any = useRef({})

  const onLayout = () => {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
    })
  }
  const onTouchMove = (e: NativeSyntheticEvent<TouchEvent>) => {
    const { bindhtouchmove, bindvtouchmove, bindtouchmove, catchtouchmove } = props
    if (touchEvent === 'htouchmove') {
      bindhtouchmove && bindhtouchmove(e)
    } else if (touchEvent === 'vtouchmove') {
      bindvtouchmove && bindvtouchmove(e)
    }
    if (bindtouchmove) {
      bindtouchmove(e)
    } else if (catchtouchmove) {
      catchtouchmove(e)
    }
  }
  const onCatchTouchMove = (e: NativeSyntheticEvent<TouchEvent>) => {
    const { catchhtouchmove, catchvtouchmove, bindtouchmove, catchtouchmove } = props
    if (touchEvent === 'htouchmove') {
      catchhtouchmove && catchhtouchmove(e)
    } else if (touchEvent === 'vtouchmove') {
      catchvtouchmove && catchvtouchmove(e)
    }
    if (bindtouchmove) {
      bindtouchmove(e)
    } else if (catchtouchmove) {
      catchtouchmove(e)
    }
  }

  const createPanResponder = () => {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onStartShouldSetPanResponderCapture: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponderCapture: () => !disabled,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: direction === 'all' || direction === 'horizontal' ? pan.x._value : 0,
          y: direction === 'all' || direction === 'vertical' ? pan.y._value : 0
        })
      },
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.numberActiveTouches === 2 && scale) {
          const touch1 = e.nativeEvent.touches[0];
          const touch2 = e.nativeEvent.touches[1];
          const currentTouchDistance = Math.sqrt(
            Math.pow(touch1.pageX - touch2.pageX, 2) + Math.pow(touch1.pageY - touch2.pageY, 2)
          );

          if (!initialDistance) {
            initialDistance = currentTouchDistance;
          } else {
            const baseScaleValue = baseScale._value;
            const newScale = (baseScaleValue * currentTouchDistance) / initialDistance;
            const clampedScale = Math.min(scaleMax, Math.max(scaleMin, newScale));

            baseScale.setValue(clampedScale)
            bindscale && bindscale(getCustomEvent('change', e, {
              detail: {
                x: pan.x._value,
                y: pan.y._value,
                scale: clampedScale
              },
              layoutRef
            }, props)
            )
          }
          return
        }
        Animated.event(
          [
            null,
            {
              dx: direction === 'all' || direction === 'horizontal' ? pan.x : new Animated.Value(0),
              dy: direction === 'all' || direction === 'vertical' ? pan.y : new Animated.Value(0),
            }
          ],
          {
            useNativeDriver: false
          }
        )(e, gestureState)
        if (isFirstTouch) {
          if (Math.abs(gestureState.dx) - Math.abs(gestureState.dy) > 0) {
            touchEvent = 'htouchmove'
          } else {
            touchEvent = 'vtouchmove'
          }
        }
        isFirstTouch = false
        bindchange &&
          bindchange(
            getCustomEvent('change', e, {
              detail: {
                x: pan.x._value,
                y: pan.y._value,
                source: 'touch'
              },
              layoutRef
            }, props)
          );
      },
      onPanResponderRelease: (e) => {
        pan.flattenOffset()
        isFirstTouch = true
        initialDistance = 0
        const x = pan.x._value > MovableAreaLayout.width - layoutRef.current.width ? MovableAreaLayout.width - layoutRef.current.width : pan.x._value < 0 ? 0 : pan.x._value
        const y = pan.y._value > MovableAreaLayout.height - layoutRef.current.height ? MovableAreaLayout.height - layoutRef.current.height : pan.y._value < 0 ? 0 : pan.y._value
        const needChange = x !== pan.x._value || y !== pan.y._value
        Animated.spring(pan, {
          toValue: { x, y },
          // friction,
          // damping,
          useNativeDriver: false
        }).start(() => {
          if (needChange) {
            bindchange &&
              bindchange(
                getCustomEvent('change', e, {
                  detail: {
                    x: pan.x._value,
                    y: pan.y._value,
                    source: 'out-of-bounds'
                  },
                  layoutRef
                }, props)
              );
          }
        })
      }
    })
  }
  createPanResponder()

  useEffect(() => {
    if (direction !== props.direction || disabled !== props.disabled) {
      setDirection(props.direction || 'none');
      setDisabled(props.disabled || false);
      createPanResponder()
    }
  }, [props.direction, props.disabled]);


  // useEffect(() => {
  //   if (scaleValue._value !== props['scale-value']) {
  //     Animated.spring(scaleValue, {
  //       toValue: props['scale-value'],
  //       friction
  //     }).start(() => {
  //       bindscale && bindscale(getCustomEvent('change', {}, {
  //         detail: {
  //           x: pan.x._value,
  //           y: pan.y._value,
  //           scale: props['scale-value'] 
  //         },
  //         layoutRef
  //       }, props)
  //     );
  //     });
  //   }
  // }, [props['scale-value']]);

  useEffect(() => {
    Animated.spring(pan, {
      toValue: { x: Number(x), y: Number(y) },
      useNativeDriver: false,
      // friction,
      // damping
    }).start(() => {
      bindchange &&
        bindchange(
          getCustomEvent('change', {}, {
            detail: {
              x: pan.x,
              y: pan.y,
              source: ''
            },
            layoutRef
          }, props)
        );
    })
  }, [x, y])

  const [translateX, translateY] = [pan.x, pan.y];

  const childrenStyle = { transform: [{ translateX }, { translateY }, { scale: scaleValue._value }] };

  const hasTouchmove = () => !!props.bindhtouchmove || !!props.bindvtouchmove || !!props.bindtouchmove;

  const hasCatchTouchmove = () => !!props.catchhtouchmove || !!props.catchvtouchmove || !!props.catchtouchmove;

  const innerProps = useInnerProps(props, {
    ref: nodeRef,
    ...panResponder.current.panHandlers,
    onLayout,
    ...(hasTouchmove() ? { 'bindtouchmove': onTouchMove } : {}),
    ...(hasCatchTouchmove() ? { 'catchtouchmove': onCatchTouchMove } : {})
  }, [
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
  ], { layoutRef });
  return (
    <Animated.View
      {...innerProps}
      style={[styles.container, childrenStyle]}
    >
      {children}
    </Animated.View>
  );
})

MovableView.displayName = 'mpx-movable-view'

export default MovableView