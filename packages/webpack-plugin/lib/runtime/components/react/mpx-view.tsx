/**
 * ✔ hover-class  
 * ✘ hover-stop-propagation
 * ✔ hover-start-time 
 * ✔ hover-stay-time
 */
import { View, Text, ViewProps, ViewStyle, NativeSyntheticEvent, StyleProp, TextStyle, ImageBackground} from 'react-native'
import * as React from 'react'

// @ts-ignore
import useInnerTouchable from './getInnerListeners'
// @ts-ignore
import useNodesRef from '../../useNodesRef' // 引入辅助函数

import { extracteTextStyle, parseBgUrl, hasTextChild, hasElementType } from './utils'

export interface _ViewProps extends ViewProps {
  style?: Array<ViewStyle>;
  children?: React.ReactNode;
  hoverStyle: Array<ViewStyle>;
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void;
}

const DEFAULT_STYLE = {
  flexDirection: 'row',
  flexShrink: 1
}

function getDefaultStyle(style: ViewStyle = {}) {
  if (style.display === 'flex') {
    return DEFAULT_STYLE
  }
  return {}
}

function getMergeStyle(style: Array<ViewStyle> = []) {
  const mergeStyle: ViewStyle = Object.assign({}, ...style)
  return {
    ...getDefaultStyle(mergeStyle),
    ...mergeStyle
  }
}

const processTextChildren = (children: React.ReactElement, textStyle:ViewStyle =  {}) => {
  return React.Children.map(children, (child) => {
    return React.cloneElement(child, {
      ...(child.props),
      style: [textStyle, child.props.style]
    })
  })
}

const processChildren = (children: React.ReactElement, style:ViewStyle =  {}) => {
  let textStyle = null

  if (!Array.isArray(children) || React.Children.only(children)) {
    if (hasElementType(children, 'mpxText')) {
      textStyle = extracteTextStyle(style)
      return React.cloneElement(children, {
        ...children.props,
        style: [textStyle, children.props.style]
      })
    } else if (hasElementType(children, 'Text')) {
      textStyle = extracteTextStyle(style)
      return React.cloneElement(children, {
        style: textStyle
      })
    } else {
      return children
    }
  }

  const hasText = hasTextChild(children, 'mpxText')
  if (hasText) {
    textStyle = extracteTextStyle(style)
  }

  return hasText ? <Text style={textStyle}> {processTextChildren(children, textStyle)} </Text> : children
}

const wrapperChilden = (children, style) => {
  const image = parseBgUrl(style.backgroundImage)
  return image ? <ImageBackground source={{ uri: image }} style={style}>
    { processChildren(children, style) }
  </ImageBackground> : processChildren(children, style)
}

const _View:React.FC<_ViewProps & React.RefAttributes<any>> = React.forwardRef((props: _ViewProps, ref: React.ForwardedRef<any>) => {
  const { 
    style,
    children,
    hoverStyle,
    ...otherProps } = props
  const [isHover, setIsHover] = React.useState(false)

  const mergeStyle: ViewStyle = style ? getMergeStyle(style) : {}

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
    const { hoverStyle, hoverStartTime = 50 } = dataRef.current.props
    if (hoverStyle) {
      dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer)
      dataRef.current.startTimer = setTimeout(() => {
        setIsHover(() => true)
      }, hoverStartTime)
    }
  }

  const setStayTimer = () => {
    const { hoverStyle, hoverStayTime = 400 } = dataRef.current.props
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

  const innerTouchable = useInnerTouchable({
    ...props,
    ...(hoverStyle && {
      bindtouchstart: onTouchStart,
      bindtouchend: onTouchEnd
    })
  })

  const { nodeRef } = useNodesRef(props, ref, {
    defaultStyle: style ? getDefaultStyle(mergeStyle) : {}
  })

  return (
    <View
      ref={nodeRef}
      {...{...otherProps, ...innerTouchable}}
      style={ [ mergeStyle, isHover && hoverStyle ] }
    >
      {wrapperChilden(children, mergeStyle)}
    </View>
  )
})

_View.displayName = 'mpxView'

export default _View



