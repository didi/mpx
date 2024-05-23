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

import { parseUrl, hasElementType, TEXT_STYLE_REGEX } from './utils'

type ExtendedViewStyle = ViewStyle & {
  backgroundImage?: string
  backgroundSize?: ImageResizeMode
}

type ElementNode = Exclude<React.ReactElement, string | number>

export interface _ViewProps extends ViewProps {
  style?: Array<ExtendedViewStyle>
  children?: ElementNode
  hoverStyle: Array<ExtendedViewStyle>
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

const DEFAULT_STYLE = {
  flexDirection: 'row',
  flexShrink: 1
}

function getDefaultStyle(style: ViewStyle = {}) {
  return style.display === 'flex' ? DEFAULT_STYLE : {}
}

function getMergeStyle(style: Array<ExtendedViewStyle> = [], hoverStyle: Array<ExtendedViewStyle> = []):ExtendedViewStyle {
  const mergedStyle: ExtendedViewStyle = Object.assign({}, ...style, ...hoverStyle)
  return {
    ...getDefaultStyle(mergedStyle),
    ...mergedStyle
  }
}

function splitStyle(style: ExtendedViewStyle) {
  let textStyle = null
  let bjImage = null
  let innerStyle = {}

  for (let key in style) {
    let val = style[key]
    if (TEXT_STYLE_REGEX.test(key)) {
      textStyle = textStyle ?? {}
      textStyle[key] = val
    }else if (['backgroundImage', 'backgroundSize'].includes(key)) {
      bjImage = bjImage ?? {
        resizeMode: 'stretch'
      }
      if (key === 'backgroundSize') {
        bjImage['resizeMode'] = val
      } else if (key === 'backgroundImage'){
        bjImage['source'] = {uri: parseUrl(val)}
      }
    } else {
      innerStyle[key] = val
    }
  }
  
  return [
    textStyle,
    bjImage,
    innerStyle,
  ]
}

const isText = (children: ElementNode) => {
  return hasElementType(children, 'mpx-text') || hasElementType(children, 'Text')
}

function every(children: ElementNode, callback: (children: ElementNode) => boolean ) {
  let hasSameElement = true

  React.Children.forEach(children, (child) => {
    if (!callback(child)) {
      hasSameElement = false
    }
  })
  
  return hasSameElement
}


const wrapChildren = (children: ElementNode, textStyle, bgImage, innerStyle) => {
  if (every(children, (child)=>isText(child))) {
    children = <Text style={textStyle}>{children}</Text>
  } else {
    if(textStyle) console.warn('Text style will be ignored unless every child of the view is Text node!')
  }

  if(bgImage){
    children = <ImageBackground {...bgImage} style={innerStyle} >{children}</ImageBackground>
  }

  return children
}


const _View:React.FC<_ViewProps & React.RefAttributes<any>> = React.forwardRef((props: _ViewProps, ref: React.ForwardedRef<any>) => {
  const { 
    style,
    children,
    hoverStyle,
    ...otherProps } = props
  const [isHover, setIsHover] = React.useState(false)

  const finalStyle:ExtendedViewStyle = getMergeStyle(style, isHover ? hoverStyle : [])

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

  const [textStyle, bgImage, innerStyle] = splitStyle(finalStyle)

  return (<View
    ref={nodeRef}
    {...{...otherProps, ...innerTouchable}}
    style={{...(!bgImage && innerStyle)}}
  >
    {wrapChildren(children, textStyle, bgImage, innerStyle)}
  </View>)
})

_View.displayName = 'mpx-view'

export default _View


