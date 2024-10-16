import { View, LayoutChangeEvent } from 'react-native'
import { ReactNode, forwardRef, useRef } from 'react'
import useInnerProps from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef' // 引入辅助函数
import { wrapChildren } from './common'
import { useTransformStyle, splitStyle, splitProps } from './utils'

interface SwiperItemProps {
  'item-id'?: string;
  'enable-offset'?: boolean;
  'enable-var': boolean;
  'external-var-context'?: Record<string, any>;
  children?: ReactNode;
  style?: Object;
}

const _SwiperItem = forwardRef<HandlerRef<View, SwiperItemProps>, SwiperItemProps>((props: SwiperItemProps, ref) => {
  const {
    'enable-offset': enableOffset,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    style,
    children
  } = props

  const { textProps } = splitProps(props)
  const layoutRef = useRef({})
  const { nodeRef } = useNodesRef(props, ref, {})

  const {
    normalStyle,
    hasVarDec,
    varContextRef,
    hasPercent,
    setContainerWidth,
    setContainerHeight
  } = useTransformStyle(style, { enableVar, externalVarContext })
  const { textStyle } = splitStyle(normalStyle)

  const onLayout = (e: LayoutChangeEvent) => {
    if (hasPercent) {
      const { width, height } = e?.nativeEvent?.layout || {}
      setContainerWidth(width || 0)
      setContainerHeight(height || 0)
    }
    if (enableOffset) {
      nodeRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
        layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
      })
    }
  }

  const innerProps = useInnerProps(props, {
    ...(enableOffset ? { onLayout } : {})
  }, [
    'children',
    'enable-offset'
  ], { layoutRef })

  return (
    <View
      ref={nodeRef}
      data-itemId={props['item-id']}
      style={[style]}
      {...innerProps}>
       {
        wrapChildren(
          props,
          {
            hasVarDec,
            varContext: varContextRef.current
          },
          {
            textStyle,
            textProps
          }
        )
      }
    </View>
  )
})

_SwiperItem.displayName = 'mpx-swiper-item'

export default _SwiperItem
