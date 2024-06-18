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
 * ✘ animation
 * ✔ bindchange
 * ✔ bindscale
 * ✔ htouchmove
 * ✔ vtouchmove
 */
import { useState, useRef, useEffect, forwardRef, ReactNode, Children } from 'react';
import { StyleSheet, Animated, NativeSyntheticEvent } from 'react-native';
import useInnerProps, { getCustomEvent } from './getInnerListeners';

interface MovableViewProps {
  children: ReactNode;
  style?: Record<string, any>;
  direction: 'all' | 'vertical' | 'horizontal' | 'none';
  x?: string | number;
  y?: string | number;
  scale?: boolean;
  disabled?: boolean;
  friction?: number;
  enableOffset?: boolean;
  'scale-value'?: number;
  'scale-min'?: number;
  'scale-max'?: number;
  bindchange?: (event: unknown) => void;
  bindscale?: (event: unknown) => void;
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  htouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
  vtouchmove?: (event: NativeSyntheticEvent<TouchEvent>) => void;
}
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
})

const MovableView = forwardRef<HandlerRef<View, MovableViewProps>, MovableViewProps>((props: MovableViewProps, ref): JSX.Element => {
  const [pan, setPan] = useState(new Animated.ValueXY());
  const [scale, setScale] = useState(new Animated.Value(1));
  const layoutRef = useRef({})
  const nodeRef = useRef(null)
  const { children, enableOffset, friction = 2, direction, x = 0, y = 0 } = props

  const onLayout = () => {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
    })
  }


  useEffect(() => {
    Animated.spring(pan, {
      toValue: { x: Number(x), y: Number(y) },
      useNativeDriver: false
    }).start()
  }, [props.x, props.y])

  const onTouchStart = (e: NativeSyntheticEvent<TouchEvent>) => {
    const { bindtouchstart } = props;
    bindtouchstart && bindtouchstart(e)
  }
  const onTouchMove = (e: NativeSyntheticEvent<TouchEvent>) => {
    const { bindtouchmove, bindchange } = props;
    bindtouchmove && bindtouchmove(e)
    pan.setValue({ x: e.detail.x, y: e.detail.y });
    bindchange &&
      bindchange(
        getCustomEvent('change', e, {
          detail: {
            x: pan.x,
            y: pan.y,
            source: 'touch'
          },
          layoutRef
        }, props)
      );
  }
  const onTouchEnd = (e: NativeSyntheticEvent<TouchEvent>) => {
    const { bindtouchend, bindchange, layout } = props;
    bindtouchend && bindtouchend(e)
    pan.flattenOffset();
    const x = pan.x._value > layout.width - layoutRef.current.width ? layout.width - layoutRef.current.width : pan.x._value < 0 ? 0 : pan.x._value
    const y = pan.y._value > layout.height - layoutRef.current.height ? layout.height - layoutRef.current.height : pan.y._value < 0 ? 0 : pan.y._value
    const needChange = x !== pan.x._value || y !== pan.y._value
    Animated.spring(pan, {
      toValue: { x, y },
      useNativeDriver: false
    }).start(() => {
      if (needChange) {
        bindchange &&
          bindchange(
            getCustomEvent('change', e, {
              detail: {
                x: pan.x,
                y: pan.y,
                source: 'friction'
              },
              layoutRef
            }, props)
          );
      }
    })
  }

  const [translateX, translateY] = [pan.x, pan.y];

  const childrenStyle = { transform: [{ translateX }, { translateY }, { scale }] };

  const innerProps = useInnerProps(props, {
    style: [styles.container, childrenStyle],
    ref: nodeRef,
    bindtouchstart: onTouchStart,
    bindtouchmove: onTouchMove,
    bindtouchend: onTouchEnd,
    ...enableOffset ? { onLayout } : {},
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