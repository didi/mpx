import { View, LayoutChangeEvent } from 'react-native'
import { ReactNode, forwardRef, useRef } from 'react'
import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { useTransformStyle, splitStyle, splitProps, wrapChildren, useLayout } from './utils'

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
}

const _SwiperItem = forwardRef<HandlerRef<View, SwiperItemProps>, SwiperItemProps>((props: SwiperItemProps, ref) => {
  const {
    'enable-offset': enableOffset,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    style
  } = props

  const { textProps } = splitProps(props)
  const { nodeRef } = useNodesRef(props, ref, {})

  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext })
  const { textStyle, innerStyle } = splitStyle(normalStyle)

  const {
    // 存储layout布局信息
    layoutRef,
    layoutProps,
    layoutStyle
  } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: nodeRef })

  const innerProps = useInnerProps(props, {
    style: { ...innerStyle, ...layoutStyle },
    ref: nodeRef,
    ...layoutProps
  }, [
    'children',
    'enable-offset'
  ], { layoutRef })

  return (
    <View
      data-itemId={props['item-id']}
      {...innerProps}>
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
    </View>
  )
})

_SwiperItem.displayName = 'MpxSwiperItem'

export default _SwiperItem
