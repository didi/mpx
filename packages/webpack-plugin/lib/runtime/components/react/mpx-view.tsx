/**
 * ✔ hover-class
 * ✘ hover-stop-propagation
 * ✔ hover-start-time
 * ✔ hover-stay-time
 */
import { View, Text, ViewStyle, NativeSyntheticEvent, ImageBackground, ImageResizeMode, StyleSheet } from 'react-native'
import * as React from 'react'

import useInnerProps from './getInnerListeners'
import useNodesRef from '../../useNodesRef' // 引入辅助函数

import { extractTextStyle, parseUrl, hasElementType } from './utils'

type ExtendedViewStyle = ViewStyle & {
  backgroundImage?: string
  backgroundSize?: ImageResizeMode
}

export interface _ViewProps extends ExtendedViewStyle {
  style?: Array<ExtendedViewStyle>;
  children?: React.ReactElement;
  hoverStyle: Array<ExtendedViewStyle>;
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
}

// const bgSizeList =  ['cover', 'contain', 'stretch']
const hasTextChild = (children: React.ReactElement<any>) => {
  let hasText = true
  React.Children.forEach(children, (child) => {
    if (!hasElementType(child, 'mpx-text') && !hasElementType(child, 'Text')) {
      hasText = false
    }
  })
  return hasText
}

const cloneElement = (child: React.ReactElement, textStyle:ViewStyle =  {}) => {
  const {style, ...otherProps} = child.props || {}
  return React.cloneElement(child, {
    ...otherProps,
    style: [textStyle, style]
  })
}

const elementInheritChildren = (children: React.ReactElement, style:ViewStyle =  {}) => {
  const inheritTextStyle = extractTextStyle(style)
  if (hasElementType(children, 'mpx-text')) {
    return cloneElement(children, inheritTextStyle)
  } else if (hasElementType(children, 'Text')) {
    return cloneElement(children, {
      // 原生 Text 组件增加默认样式
      fontSize: 16,
      ...inheritTextStyle
    })
  } else {
    return children
  }
}

const wrapTextChildren = (children: React.ReactElement, style:ViewStyle =  {}) => {
  const hasText = hasTextChild(children)
  const textStyle = {
    fontSize: 16,
    ...hasText && extractTextStyle(style)
  }
  return hasText ? <Text style={textStyle}>{children}</Text> : children
}

const processChildren = (children: React.ReactElement, style:ViewStyle =  {}) => {
  return Array.isArray(children) ? wrapTextChildren(children, style) : elementInheritChildren(children, style)
}

const processBackgroundChildren = (children: React.ReactElement, style:ExtendedViewStyle =  {}, image) => {
  let resizeMode:ImageResizeMode = 'stretch'
  if (['cover', 'contain', 'stretch'].includes(style.backgroundSize)) {
    resizeMode = style.backgroundSize
  }

  // 直接替换view,点击会时不时的不生效
  return <ImageBackground source={{ uri: image }} style={style} resizeMode={resizeMode}>
    { processChildren(children, style) }
  </ImageBackground>
}

const wrapChildren = (children, style, image) => {
  return image ? processBackgroundChildren(children, style, image) : processChildren(children, style)
}

const _View:React.FC<_ViewProps & React.RefAttributes<any>> = React.forwardRef((props: _ViewProps, ref: React.ForwardedRef<any>): React.JSX.Element => {
  const {
    style = [],
    children,
    hoverStyle,
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
    onLayout,
    ...(hoverStyle && {
      bindtouchstart: onTouchStart,
      bindtouchend: onTouchEnd
    })
  }, [
    'style',
    'children',
    'hover-start-time',
    'hover-stay-time',
    'hoverStyle'
  ], {
    layoutRef
  })

  const image = parseUrl(styleObj.backgroundImage)

  return (
    <View
      {...innerProps}
      style={{
        ...defaultStyle,
        ...!image && styleObj,
        ...isHover && hoverStyle
      }}
    >
      {wrapChildren(children, { ...defaultStyle, ...styleObj }, image)}
    </View>
  )
})

_View.displayName = 'mpx-view'

export default _View
