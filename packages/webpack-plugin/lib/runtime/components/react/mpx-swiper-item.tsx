import { View } from 'react-native'
import Animated, { useAnimatedStyle, interpolate, SharedValue } from 'react-native-reanimated'
import { ReactNode, forwardRef, useRef, useContext } from 'react'
import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { useTransformStyle, splitStyle, splitProps, wrapChildren, useLayout } from './utils'
import { SwiperContext } from './context'

interface SwiperItemProps {
  'item-id'?: string;
  'enable-offset'?: boolean;
  'enable-var': boolean;
  'external-var-context'?: Record<string, any>;
  'parent-font-size'?: number;
  'parent-width'?: number;
  'parent-height'?: number;
  children?: ReactNode;
  style?: Object;
  itemIndex: number;
  scale: boolean
}

interface ContextType {
  offset: SharedValue<number>,
  stepValue: number
}

const _SwiperItem = forwardRef<HandlerRef<View, SwiperItemProps>, SwiperItemProps>((props: SwiperItemProps, ref) => {
  const {
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    style,
    itemIndex,
    scale
  } = props

  const contextValue = useContext(SwiperContext) as ContextType
  const offset = contextValue.offset || 0
  const stepValue = contextValue.stepValue || 0

  const { textProps } = splitProps(props)
  const nodeRef = useRef(null)

  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext })
  const { textStyle, innerStyle } = splitStyle(normalStyle)
  useNodesRef(props, ref, nodeRef, {
    style: normalStyle
  })

  const {
    // 存储layout布局信息
    layoutRef,
    layoutProps,
    layoutStyle
  } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: nodeRef })

  const innerProps = useInnerProps(props, {
    ref: nodeRef,
    ...layoutProps
  }, [
    'children',
    'enable-offset',
    'style'
  ], { layoutRef })

  const itemAnimatedStyle = useAnimatedStyle(() => {
    if (!stepValue) return {}
    const inputRange = [-stepValue, 0, stepValue]
    const outputRange = [0.7, 1, 0.7]
    return {
      transform: [{
        scale: interpolate(Math.abs(offset.value) - itemIndex * stepValue, inputRange, outputRange)
      }]
    }
  })

  return (
    <Animated.View
      {...innerProps}
      style={[innerStyle, layoutStyle, scale ? itemAnimatedStyle : {}]}
      data-itemId={props['item-id']}>
      {
        wrapChildren(
          props,
          {
            hasVarDec,
            varContext: varContextRef.current,
            textStyle,
            textProps
          }
        )
      }
    </Animated.View>
  )
})

_SwiperItem.displayName = 'MpxSwiperItem'

export default _SwiperItem
