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

import { parseUrl, TEXT_STYLE_REGEX, PERCENT_REGX } from './utils'

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

type Handler = (...args: any []) => void

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
    handler(...args)
  }
}

const isLayoutEvent = (style) => {  
  const [width, height] = style.sizeList || []
  return (PERCENT_REGX.test(height) && width === 'auto') || (PERCENT_REGX.test(width) && height === 'auto')
}

/**
 * h - 用户设置的高度
 * lh - 容器的高度
 * ratio - 原始图片的宽高比
 * **/
function calculateSize(h, lh, ratio) {
  let height, width
  if (PERCENT_REGX.test(h)) { // auto  px/rpx 
    height = (parseFloat(h) / 100) * lh
    width = height * ratio
  } else { // 2. auto px/rpx - 根据比例计算
    height = h
    width = height * ratio
  }

  return {
    width,
    height 
  }
}

const imageStyleToProps = (imageStyle: ExtendedViewStyle, imageSize, layoutInfo, preImageInfo) => {
  if (!imageStyle) return null
  // 初始化
  const imageProps: ImageProps = {
    style: {
      resizeMode: 'cover',
      ...StyleSheet.absoluteFillObject
    }
  }

  // background-size 转换
  function backgroundSize (imageStyle, imageProps, preImageInfo, imageSize, layoutInfo) {
    let sizeList = preImageInfo.sizeList
    if (!sizeList) return
    // 枚举值
    
    if (['cover', 'contain'].includes(sizeList[0])) {
      imageProps.style.resizeMode = sizeList[0]
    } else {
      const [width, height] = sizeList
      let newWidth = 0, newHeight = 0

      const { width: imageSizeWidth, height: imageSizeHeight } = imageSize || {}

      if (width === 'auto' && height === 'auto' && imageSize) { // 均为auto
        newHeight = imageSizeHeight
        newWidth = imageSizeWidth
      } else if (width === 'auto' && imageSize) { // auto px/rpx/%
        const dimensions = calculateSize(height, layoutInfo?.height, imageSizeWidth / imageSizeHeight)
        newWidth = dimensions.width
        newHeight = dimensions.height
      }else if (height === 'auto' && imageSize) { // auto px/rpx/%
        const dimensions = calculateSize(width, layoutInfo?.width,  imageSizeHeight / imageSizeWidth)
        newHeight = dimensions.width
        newWidth = dimensions.height
      } else { // 数值类型
        // 数值类型设置为 stretch
        imageProps.style.resizeMode = 'stretch'
        newWidth = PERCENT_REGX.test(width) ? width : +width
        newHeight = PERCENT_REGX.test(height) ? height : +height
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
  function backgroundImage(imageStyle, imageProps, preImageInfo) {
    let val = imageStyle.backgroundImage
    let src = preImageInfo.src ?  preImageInfo.src : parseUrl(val)
    if (!src) return null
    imageProps.src = src
  }

  applyHandlers([ backgroundSize, backgroundImage ],[imageStyle, imageProps, preImageInfo, imageSize, layoutInfo])
  if (!imageProps?.src) return null

  return imageProps
}


function preParseImage(imageStyle:ExtendedViewStyle) {
  const { backgroundImage, backgroundSize = [] } = imageStyle
  const src = parseUrl(backgroundImage)
  if (!src) return null

  let sizeList = backgroundSize.slice()

  sizeList.length === 1 &&  sizeList.push(sizeList[0])

  return {
    src,
    sizeList
  }
}

function wrapImage(imageStyle) {
  const [show, setShow] = useState(false)
  const [imageSize, setImageSize] = useState(null);
  const [layoutInfo, setLayoutInfo] = useState(null)

  // 预解析
  const preImageInfo = preParseImage(imageStyle)

  if (!preImageInfo) return null

  // 判断是否可挂载onLayout
  const isViewLayout = isLayoutEvent(preImageInfo)

  let bgImage = null

  if (show) {
    bgImage = imageStyleToProps(imageStyle, imageSize, layoutInfo, preImageInfo)
  }

  useEffect(() => {
    const { src, sizeList = [] } = preImageInfo

    if (!src) return
    if (!sizeList.includes('auto')) {
      setShow(true)
      return
    }
    Image.getSize(src, (width, height) => {
      setImageSize({ width, height });
      //1. 当需要绑定onLayout 2. 获取到布局信息
      (!isViewLayout || layoutInfo) && setShow(true)
    }, () => {
      setShow(false)
      setImageSize(null)
      setLayoutInfo(null)
    })
    return () => {
      setShow(false)
      setImageSize(null)
      setLayoutInfo(null)
    }
  }, [imageStyle.backgroundImage])
  

  const onLayout = (res) => {
    const layout  = res?.nativeEvent?.layout
    setLayoutInfo({
      height: layout.height,
      width: layout.width
    })
    imageSize && setShow(true)
  }

  const props = isViewLayout ? {
    onLayout
  } : {}
  return <View {...props}  style={{ ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', overflow: 'hidden'}}>
  {show && <Image {...bgImage}/>}
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

const isText = (ele: ElementNode) => {
  const displayName = ele?.type?.displayName
  return displayName === 'mpx-text' || displayName === 'Text'
}

function every(children: ElementNode, callback: (children: ElementNode) => boolean ) {
  return Children.toArray(children).every((child) => callback(child as ElementNode))
}

function wrapChildren(children: ElementNode, textStyle?: ExtendedViewStyle, imageStyle?: ExtendedViewStyle) {
  if (every(children, (child)=>isText(child))) {
    children = <Text style={textStyle}>{children}</Text>
  } else {
    if(textStyle) console.warn('Text style will be ignored unless every child of the view is Text node!')
  }

  return [imageStyle && wrapImage(imageStyle),
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
    dataRef.current.startTimer && clearTimeout(dataRef.current.startTimer)
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

  const onLayout = () => {
  
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
    ...enableOffset ? { onLayout } : {},
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
      {wrapChildren(children, textStyle, imageStyle)}
    </View>
  )
})

_View.displayName = 'mpx-view'

export default _View

