/**
 * ✔ hover-class
 * ✘ hover-stop-propagation
 * ✔ hover-start-time
 * ✔ hover-stay-time
 */
import { View, ViewStyle, NativeSyntheticEvent, ImageResizeMode, StyleSheet } from 'react-native'
import * as React from 'react'

import useInnerProps from './getInnerListeners'
import useNodesRef from '../../useNodesRef' // 引入辅助函数

type ExtendedViewStyle = ViewStyle & {
  backgroundImage?: string
  backgroundSize?: ImageResizeMode
}

export interface _ViewProps extends ExtendedViewStyle {
  style?: Array<ExtendedViewStyle>;
  children?: React.ReactElement;
  hoverStyle: Array<ExtendedViewStyle>;
  ['enable-offset']?: boolean;
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
}

const _View:React.FC<_ViewProps & React.RefAttributes<any>> = React.forwardRef((props: _ViewProps, ref: React.ForwardedRef<any>): React.JSX.Element => {
  const {
    style = [],
    children,
    hoverStyle,
    'enable-offset': enableOffset
  } = props
  const [isHover, setIsHover] = React.useState(false)

  const layoutRef = React.useRef({})

  // 打平 style 数组
  const styleObj:ExtendedViewStyle = StyleSheet.flatten(style)
  // 默认样式
  const defaultStyle = {
    // flex 布局相关的默认样式
    ...styleObj.display === 'flex' && {
      flexDirection: 'row',
      flexBasis: 'auto',
      flexShrink: 1,
      flexWrap: 'nowrap'
    }
  }

  const { nodeRef } = useNodesRef(props, ref, {
    defaultStyle
  })

  const dataRef = React.useRef<{
    startTimestamp: number,
    startTimer?: ReturnType<typeof setTimeout>
    stayTimer?: ReturnType<typeof setTimeout>
    props: any
  }>({
    startTimestamp: 0,
    props: props
  })

  React.useEffect(() => {
    return () => {
      dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer)
      dataRef.current.stayTimer && clearTimeout(dataRef.current.stayTimer)
    }
  }, [dataRef])

  const setStartTimer = () => {
    const { hoverStyle, 'hover-start-time': hoverStartTime = 50 } = dataRef.current.props
    if (hoverStyle) {
      dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer)
      dataRef.current.startTimer = setTimeout(() => {
        setIsHover(() => true)
      }, hoverStartTime)
    }
  }

  const setStayTimer = () => {
    const { hoverStyle, 'hover-stay-time': hoverStayTime = 400 } = dataRef.current.props
    if (hoverStyle) {
      dataRef.current.stayTimer && clearTimeout(dataRef.current.stayTimer)
      dataRef.current.stayTimer = setTimeout(() => {
        setIsHover(() => false)
      }, hoverStayTime)
    }
  }

  function onTouchStart(e: NativeSyntheticEvent<TouchEvent>){
    const { bindtouchstart } = props;
    bindtouchstart && bindtouchstart(e)
    setStartTimer()
  }

  function onTouchEnd(e: NativeSyntheticEvent<TouchEvent>){
    const { bindtouchend } = props;
    bindtouchend && bindtouchend(e)
    setStayTimer()
  }

  const onLayout = () => {
    nodeRef.current?.measure((x, y, width, height, offsetLeft, offsetTop) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
    })
  }

  const innerProps = useInnerProps(props, {
    ref: nodeRef,
    ...(enableOffset ? { onLayout } : {}),
    ...(hoverStyle && {
      bindtouchstart: onTouchStart,
      bindtouchend: onTouchEnd
    })
  }, [
    'style',
    'children',
    'hover-start-time',
    'hover-stay-time',
    'hoverStyle',
    'hover-class',
    'enable-offset'
  ], {
    layoutRef
  })

  return (
    <View
      {...innerProps}
      style={{
        ...defaultStyle,
        ...styleObj,
        ...isHover && hoverStyle
      }}
    >
      {children}
    </View>
  )
})

_View.displayName = 'mpx-view'

export default _View
