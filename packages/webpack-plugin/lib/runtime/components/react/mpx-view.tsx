/**
 * ✔ hover-class
 * ✘ hover-stop-propagation
 * ✔ hover-start-time
 * ✔ hover-stay-time
 */
import { View, Text, ViewStyle, NativeSyntheticEvent, ImageBackground, ImageResizeMode, StyleSheet, Image } from 'react-native'
import * as React from 'react'

// @ts-ignore
import useInnerProps from './getInnerListeners'
// @ts-ignore
import useNodesRef from '../../useNodesRef' // 引入辅助函数

import { parseUrl, hasElementType, TEXT_STYLE_REGEX } from './utils'

type ElementNode = Exclude<React.ReactElement, string | number>

type ExtendedViewStyle = ViewStyle & {
  backgroundImage?: string
  backgroundSize?: ImageResizeMode
}

type ImageProps = {
  resizeMode?: ImageResizeMode
  source?: {
    uri: string
  }
}


export interface _ViewProps extends ExtendedViewStyle {
  style?: Array<ExtendedViewStyle>
  children?: ElementNode
  hoverStyle: Array<ExtendedViewStyle>
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

type GroupData = {
  [key: string]: ExtendedViewStyle
}

function groupBy(style, callback, group = {}):GroupData {
  let groupKey = ''
  for (let key in style) {
    let val = style[key]
    if (typeof val === 'object') {
      groupBy(style[key], callback, group)
      continue
    }
    groupKey = callback(key, val)
    if (!group[groupKey]) {
      group[groupKey] = {}
    }
    group[groupKey][key] = val
  }
  return group
}


const imageStyleToProps = (imageStyle: ExtendedViewStyle) => {
  if (!imageStyle) return null
  let bgImage:ImageProps = {
    resizeMode: 'stretch'
  }
  if (imageStyle['backgroundSize']) {
    bgImage['resizeMode'] = imageStyle['backgroundSize']
  }
  if (imageStyle['backgroundImage']){    
    const url = parseUrl(imageStyle['backgroundImage'])
    if (!url) return null
    bgImage['source'] = {uri: url}
  }

  return bgImage
}


function splitStyle(styles: ExtendedViewStyle []) {
  const {textStyle, imageStyle, innerStyle} = groupBy(styles, (key) => {
    if (TEXT_STYLE_REGEX.test(key))
      return 'textStyle'
    else if (['backgroundImage', 'backgroundSize'].includes(key)) return 'imageStyle'
    return 'innerStyle'
  }, {})
  console.log(">>> textStyle, imageStyle, innerStyle", textStyle, imageStyle, innerStyle)
  return {
    textStyle, 
    bgImage: imageStyleToProps(imageStyle),
    innerStyle
  }
}

const isText = (children: ElementNode) => {
  return hasElementType(children, 'mpx-text') || hasElementType(children, 'Text')
}

function every(children: ElementNode, callback: (children: ElementNode) => boolean ) {
  return React.Children.toArray(children).every((child) => callback(child as ElementNode))
}

function wrapChildren(children: ElementNode, innerStyle: ExtendedViewStyle = {}, textStyle?: ExtendedViewStyle, bgImage?: ImageProps) {
  if (every(children, (child)=>isText(child))) {
    children = <Text style={textStyle}>{children}</Text>
  } else {
    if(textStyle) console.warn('Text style will be ignored unless every child of the view is Text node!')
  }
  return <>
    {bgImage && <Image style={[StyleSheet.absoluteFill, { width: innerStyle.width, height: innerStyle.height}]} {...bgImage} />}
    {children}
  </>
}

const _View:React.FC<_ViewProps & React.RefAttributes<any>> = React.forwardRef((props: _ViewProps, ref: React.ForwardedRef<any>): React.JSX.Element => {
  let {
    style = [],
    children,
    hoverStyle,
  } = props
  const [isHover, setIsHover] = React.useState(false)
  const measureTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const innerProps = useInnerProps(props, {
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
    touchable: true
  })

  // 打平 style 数组
  const styleObj:ExtendedViewStyle = StyleSheet.flatten<ExtendedViewStyle>(style)
  // 默认样式
  const defaultStyle:ExtendedViewStyle = {
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

  React.useEffect(() => {
    setTimeout(() => {
      nodeRef.current = nodeRef.current.measure((x, y, width, height, offsetLeft, offsetTop) => {
        nodeRef.current = { x, y, width, height, offsetLeft, offsetTop }
      })
    })
    return () => {
      measureTimeout.current && clearTimeout(measureTimeout.current);
      measureTimeout.current = null
    }
  }, [nodeRef])

  const {textStyle, bgImage, innerStyle} = splitStyle([
    defaultStyle,
    styleObj,
    isHover ? StyleSheet.flatten(hoverStyle) : {}
  ])

  return (
    <View
      ref={nodeRef}
      {...innerProps}
      style={innerStyle}
    >
      {wrapChildren(children, innerStyle, textStyle, bgImage)}
    </View>
  )
})

_View.displayName = 'mpx-view'

export default _View

