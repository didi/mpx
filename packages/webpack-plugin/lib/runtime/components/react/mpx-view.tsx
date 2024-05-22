/**
 * ✔ hover-class  
 * ✘ hover-stop-propagation
 * ✔ hover-start-time 
 * ✔ hover-stay-time
 */
import { View, Text, ViewProps, ViewStyle, NativeSyntheticEvent, StyleProp, TextStyle, ImageBackground, ImageResizeMode} from 'react-native'
import * as React from 'react'

// @ts-ignore
import useInnerTouchable from './getInnerListeners'
// @ts-ignore
import useNodesRef from '../../useNodesRef' // 引入辅助函数

import { extractTextStlye, parseUrl, hasElementType } from './utils'

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


const bgSizeList =  ['cover', 'contain', 'stretch']

const DEFAULT_STYLE = {
  flexDirection: 'row',
  flexShrink: 1
}

function getDefaultStyle(style: ViewStyle = {}) {
  return style.display === 'flex' ? DEFAULT_STYLE : {}
}

function getMergeStyle(style: Array<ExtendedViewStyle> = []):ExtendedViewStyle {
  const mergedStyle: ExtendedViewStyle = Object.assign({}, ...style)
  return {
    ...getDefaultStyle(mergedStyle),
    ...mergedStyle
  }
}

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
  let textStyle = null

  if (hasElementType(children, 'mpx-text')) {
    textStyle = extractTextStlye(style)
    return cloneElement(children, textStyle)
  }else if (hasElementType(children, 'Text')) {
    return cloneElement(children, textStyle)
  } else {
    return children
  }
}

const wrapTextChildren = (children: React.ReactElement, style:ViewStyle =  {}) => {
  let textStyle = null

  const hasText = hasTextChild(children)
  if (hasText) {
    textStyle = extractTextStlye(style)
  }

  return hasText ? <Text style={textStyle}>{ children }</Text> : children
}

const processChildren = (children: React.ReactElement, style:ViewStyle =  {}) => {
  return !Array.isArray(children) ? elementInheritChildren(children, style) : 
    wrapTextChildren(children, style)
}


const processBackgroundChildren = (children: React.ReactElement, style:ExtendedViewStyle =  {}, image) => {
  let resizeMode:ImageResizeMode = 'stretch'
  if (bgSizeList.includes(style.backgroundSize)) {
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

const _View:React.FC<_ViewProps & React.RefAttributes<any>> = React.forwardRef((props: _ViewProps, ref: React.ForwardedRef<any>) => {
  const { 
    style,
    children,
    hoverStyle,
    ...otherProps } = props
  const [isHover, setIsHover] = React.useState(false)

  const finalStyle:ExtendedViewStyle = getMergeStyle(style)

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
    defaultStyle: getDefaultStyle(finalStyle)
  })

  const image = parseUrl(finalStyle.backgroundImage)
  
  return (
    <View
      ref={nodeRef}
      {...{...otherProps, ...innerTouchable}}
      style={ [ !image && finalStyle, isHover && hoverStyle ] }
    >
      {wrapChildren(children, finalStyle, image)}
    </View>
  )
})

_View.displayName = 'mpx-view'

export default _View



