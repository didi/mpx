/**
 * ✔ hover-class
 * ✘ hover-stop-propagation
 * ✔ hover-start-time
 * ✔ hover-stay-time
 */
import { View, Text, ViewStyle, NativeSyntheticEvent, ImageProps, ImageResizeMode, StyleSheet, Image, ImageURISource, ImageStyle } from 'react-native'
import React, { useRef, useState, useEffect, forwardRef, Children, ForwardedRef } from 'react'

// @ts-ignore
import useInnerProps from './getInnerListeners'
// @ts-ignore
import useNodesRef from '../../useNodesRef' // 引入辅助函数

import { parseUrl, hasElementType, TEXT_STYLE_REGEX, PERCENT_REGX } from './utils'

type ElementNode = React.ReactNode

type ExtendedViewStyle = ViewStyle & {
  backgroundImage?: string
  backgroundSize?: ImageResizeMode
}

export interface _ViewProps extends ExtendedViewStyle {
  style?: Array<ExtendedViewStyle>
  children?: ElementNode
  hoverStyle: Array<ExtendedViewStyle>
  ['hover-start-time']: number
  ['hover-stay-time']: number
  'enable-offset'?: boolean
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

type GroupData = {
  [key: string]: ExtendedViewStyle
}

type Handler = ([imageStyle, imageProps, originImage, layoutInfo]: [ExtendedViewStyle, ImageProps, any, any]) => void

const IMAGE_STYLE_REGEX = /^background(Image|Size|Repeat|Position)$/

function groupBy(style, callback, group = {}):GroupData {
  let groupKey = ''
  for (let key in style) {
    let val = style[key]
    groupKey = callback(key, val)
    if (!group[groupKey]) {
      group[groupKey] = {}
    }
    group[groupKey][key] = val
  }
  return group
}

const applyHandlers = (handlers: Handler[] , args) => {
  for (let handler of handlers) {
    handler(args)
  }
}

const isLayout = (style: ExtendedViewStyle = {}) => {
  if (!style?.backgroundImage) return false
  const [width, height] = style.backgroundSize || []
  return (PERCENT_REGX.test(height) && width === 'auto') || (PERCENT_REGX.test(width) && height === 'auto')
}

const imageStyleToProps = (imageStyle: ExtendedViewStyle, originImage, layoutInfo) => {
  if (!imageStyle) return null
  // 初始化
  const imageProps: ImageProps = {
    style: {
      resizeMode: 'cover',
      ...StyleSheet.absoluteFillObject
    }
  }

  // background-size 转换
  function backgroundSize ([imageStyle, imageProps, originImage, layoutInfo]) {
    let val = imageStyle.backgroundSize
    if (!val) return
    // 枚举值
    
    if (['cover', 'contain'].includes(val[0])) {
      imageProps.style.resizeMode = val
    } else{
      let sizeList = val.slice()
      //  归一化
      if (sizeList.length === 1) {
        sizeList.push(sizeList[0])
      }
      const [width, height] = sizeList
      let newWidth = 0, newHeight = 0

      const { width: originWidth, height: originHeight } = originImage || {}

      // 若background-size为auto 则不设置宽高
    //  if (width === 'auto' && height === 'auto') return
      if (width === 'auto' && height === 'auto' && originImage) {
      newHeight = originHeight
      newWidth = originWidth
      } else if (width === 'auto' && originImage) {
        // 1. auto % - 真实的宽度
        if (PERCENT_REGX.test(height)) {
          if (!layoutInfo) return 
          const { height: layoutHeight} = layoutInfo

          newHeight = (parseFloat(height) / 100) * layoutHeight
          newWidth = newHeight * originWidth / originHeight
        } else { // 2. auto px/rpx - 根据比例计算
          newHeight = height
          newWidth = newHeight * originWidth / originHeight
        }
      }else if (height === 'auto' && originImage) { // 10px auto
        // 1. % auto - 真实的宽度
        if (PERCENT_REGX.test(width)) {
          if (!layoutInfo) return
          const { width: layoutWidth} = layoutInfo
          newWidth = (parseFloat(width) / 100) * layoutWidth
          newHeight = newWidth * originHeight / originWidth
        } else { // 2. px/rpx auto - 根据比例计算
          newWidth = width
          newHeight = newWidth * originHeight / originWidth
          }        
      } else {
        // 数值类型设置为 stretch
        imageProps.style.resizeMode = 'stretch'
        newWidth = width === 'auto' ? (originImage?.width || width) : PERCENT_REGX.test(width) ? width : +width
        newHeight = height === 'auto' ? (originImage?.height || height) : PERCENT_REGX.test(height) ? height : +height
      }
    
      // 样式合并
      imageProps.style = {
        ...imageProps.style,
        width: newWidth,
        height: newHeight
      }
    }
  }
  // background-image转换为source
  function backgroundImage([imageStyle, imageProps, ...others]) {
    let val = imageStyle.backgroundImage
    if (!val) return 
    const url = parseUrl(val)
    if (!url) return null
    imageProps.source = {uri: url}
  }

  applyHandlers([ backgroundSize, backgroundImage ],[imageStyle, imageProps, originImage, layoutInfo])

  if (!imageProps?.source) return null

  return imageProps
}

function wrapImage(imageStyle, layoutInfo) {
  const [isLoading, setIsLoading] = useState(false)
  const [originImage, setOriginImage] = useState(null);

  const bgImage = imageStyleToProps(imageStyle, originImage, layoutInfo)
  if (!imageStyle) return null

  useEffect(() => {
    const { style, source } = bgImage
    let { uri } = (source || {}) as ImageURISource
    let { height, width  } = (style || {}) as ImageStyle
  
    if (!uri) return;
  //  if ((height=== 'auto' && width === 'auto') ||  ![height, width].includes('auto')) return 
    if (![height, width].includes('auto')) return 
    setIsLoading(true)
    Image.getSize(uri, (width, height) => {
      setIsLoading(false)      
      setOriginImage({
        width,
        height
      })
    }, () => {
      setIsLoading(false)
      setOriginImage(null)
    })
    return () => {
      setIsLoading(false)
      setOriginImage(null)
    }
  }, [imageStyle.backgroundImage, imageStyle.backgroundSize])
  

  return bgImage && !isLoading && <View style={{ ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', overflow: 'hidden'}}>
  <Image {...bgImage}/>
</View>
}


function splitStyle(styles: ExtendedViewStyle) {
  return groupBy(styles, (key) => {
    if (TEXT_STYLE_REGEX.test(key))
      return 'textStyle'
    else if (IMAGE_STYLE_REGEX.test(key)) return 'imageStyle'
    return 'innerStyle'
  }, {})
}

const isText = (children: ElementNode) => {
  return hasElementType(children, 'mpx-text') || hasElementType(children, 'Text')
}

function every(children: ElementNode, callback: (children: ElementNode) => boolean ) {
  return Children.toArray(children).every((child) => callback(child as ElementNode))
}

function wrapChildren(children: ElementNode, textStyle?: ExtendedViewStyle, imageStyle?: ExtendedViewStyle, layoutInfo?: any) {
  if (every(children, (child)=>isText(child))) {
    children = <Text style={textStyle}>{children}</Text>
  } else {
    if(textStyle) console.warn('Text style will be ignored unless every child of the view is Text node!')
  }

  return [wrapImage(imageStyle, layoutInfo),
    children
  ]
}

const _View = forwardRef((props: _ViewProps, ref: ForwardedRef<any>): React.JSX.Element => {
  const {
    style = [],
    children,
    hoverStyle,
    'hover-start-time': hoverStartTime = 50,
    'hover-stay-time': hoverStayTime = 400,
    'enable-offset': enableOffset
  } = props

  const [isHover, setIsHover] = useState(false)

  const [layoutInfo, setLayoutInfo] = useState(null)

  const layoutRef = useRef({})

  // 打平 style 数组
  const styleObj:ExtendedViewStyle = StyleSheet.flatten(style)
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

  const dataRef = useRef<{
    startTimer?: ReturnType<typeof setTimeout>
    stayTimer?: ReturnType<typeof setTimeout>
  }>({})

  useEffect(() => {
    return () => {
      dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer)
      dataRef.current.stayTimer && clearTimeout(dataRef.current.stayTimer)
    }
  }, [])

  const setStartTimer = () => {
    dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer)
    dataRef.current.startTimer = setTimeout(() => {
      setIsHover(() => true)
    }, +hoverStartTime)
  }

  const setStayTimer = () => {
    dataRef.current.stayTimer && clearTimeout(dataRef.current.stayTimer)
    dataRef.current.stayTimer = setTimeout(() => {
      setIsHover(() => false)
    }, +hoverStayTime)
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

  const onLayout = (res) => {
    const layout  = res?.nativeEvent?.layout
    layout && setLayoutInfo({
      height: layout.height,
      width: layout.width
    })
    nodeRef.current?.measure((x, y, width, height, offsetLeft, offsetTop) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
    })
  }

  const {textStyle, imageStyle, innerStyle} = splitStyle(StyleSheet.flatten<ExtendedViewStyle>([ 
    defaultStyle,
    styleObj,
    ...(isHover ? hoverStyle : [])]
  ))

  const innerProps = useInnerProps(props, {
    ref: nodeRef,
    onLayout,
    ...((enableOffset || isLayout(imageStyle)) ? { onLayout } : {}),
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
  ])

  return (
    <View
      ref={nodeRef}
      {...innerProps}
      style={innerStyle}
    >
      {wrapChildren(children, textStyle, imageStyle, layoutInfo)}
    </View>
  )
})

_View.displayName = 'mpx-view'

export default _View

