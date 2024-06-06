/**
 * ✔ hover-class
 * ✘ hover-stop-propagation
 * ✔ hover-start-time
 * ✔ hover-stay-time
 */
import { View, Text, StyleProp, TextStyle, ViewStyle, NativeSyntheticEvent, ViewProps, ImageStyle, ImageResizeMode, StyleSheet, Image, LayoutChangeEvent } from 'react-native'
import { useRef, useState, useEffect, forwardRef, ForwardedRef, ReactNode, JSX } from 'react'
// @ts-ignore
import useInnerProps from './getInnerListeners'
// @ts-ignore
import useNodesRef from '../../useNodesRef' // 引入辅助函数

import { parseUrl, TEXT_STYLE_REGEX, PERCENT_REGX, isText} from './utils'


type ExtendedViewStyle = ViewStyle & {
  backgroundImage?: string
  backgroundSize?: ImageResizeMode
}

export interface _ViewProps extends ViewProps {
  style?: Array<ExtendedViewStyle>
  children?: ReactNode | ReactNode []
  hoverStyle: Array<ExtendedViewStyle>
  ['hover-start-time']: number
  ['hover-stay-time']: number
  'enable-offset'?: boolean
  bindtouchstart?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
  bindtouchmove?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
  bindtouchend?: (event: NativeSyntheticEvent<TouchEvent> | unknown) => void
}

type Obj = Record<string, any>

type GroupData = Record<string, Record<string, any>>;

type Handler = (...args: any []) => void

type Size = {
  width: number,
  height: number
}

type DimensionValue = number | 'auto' | `${number}%`

type PreImageInfo = {
  src?: string,
  sizeList: DimensionValue []
}

type ImageProps = {
  style: ImageStyle,
  src?: string
}

const IMAGE_STYLE_REGEX = /^background(Image|Size|Repeat|Position)$/

function groupBy(style: Obj, callback: (key: string, val: string) => string, group:GroupData = {}):GroupData {
  let groupKey = ''
  for (let key in style) {
    if (style.hasOwnProperty(key)) { // 确保处理对象自身的属性
      let val: string = style[key] as string
      groupKey = callback(key, val)
      if (!group[groupKey]) {
        group[groupKey] = {}
      }
      group[groupKey][key] = val  
    }
  }
  return group
}

const applyHandlers = (handlers: Handler[] , args: any [] ) => {
  for (let handler of handlers) {
    handler(...args)
  }
}

const checkNeedLayout = (style: PreImageInfo) => {  
  const [width, height] = style.sizeList
  return (PERCENT_REGX.test(`${height}`) && width === 'auto') || (PERCENT_REGX.test(`${width}`) && height === 'auto')
}

/**
 * h - 用户设置的高度
 * lh - 容器的高度
 * ratio - 原始图片的宽高比
 * **/
function calculateSize(h: number, lh: number, ratio: number) {
  let height, width
  if (PERCENT_REGX.test(`${h}`)) { // auto  px/rpx 
    if (!lh) return null
    height = (parseFloat(`${h}`) / 100) * lh
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

// background-size 转换
function backgroundSize (imageProps: ImageProps, preImageInfo: PreImageInfo, imageSize: Size, layoutInfo: Size) {
  let sizeList = preImageInfo.sizeList
  if (!sizeList) return
  // 枚举值
  if (['cover', 'contain'].includes(`${sizeList[0]}`)) {
    imageProps.style.resizeMode = sizeList[0] as ImageResizeMode
  } else {
    const [width, height] = sizeList
    let newWidth: ImageStyle['width'] = 0, newHeight: ImageStyle['height'] = 0

    const { width: imageSizeWidth, height: imageSizeHeight } = imageSize || {}

    if (width === 'auto' && height === 'auto') { // 均为auto
      if (!imageSize) return
      newHeight = imageSizeHeight
      newWidth = imageSizeWidth
    } else if (width === 'auto') { // auto px/rpx/%
      if (!imageSize) return
      const dimensions = calculateSize(height as number, layoutInfo?.height, imageSizeWidth / imageSizeHeight)
      if (!dimensions) return
      newWidth = dimensions.width
      newHeight = dimensions.height
    }else if (height === 'auto') { // auto px/rpx/%
      if (!imageSize) return
      const dimensions = calculateSize(width as number, layoutInfo?.width,  imageSizeHeight / imageSizeWidth)
      if (!dimensions) return
      newHeight = dimensions.width
      newWidth = dimensions.height
    } else { // 数值类型      ImageStyle
      // 数值类型设置为 stretch
      (imageProps.style as ImageStyle).resizeMode = 'stretch'
      newWidth = PERCENT_REGX.test(`${width}`) ? width : +width! as DimensionValue
      newHeight = PERCENT_REGX.test(`${width}`) ? height : +height! as DimensionValue
    }
    // 样式合并
    imageProps.style = {
      ...imageProps.style as ImageStyle,
      width: newWidth,
      height: newHeight
    }
  }
}

// background-image转换为source
function backgroundImage(imageProps: ImageProps, preImageInfo: PreImageInfo) {
  imageProps.src = preImageInfo.src
}

const imageStyleToProps = (preImageInfo: PreImageInfo, imageSize: Size, layoutInfo: Size) => {
  // 初始化
  const imageProps: ImageProps = {
    style: {
      resizeMode: 'cover' as ImageResizeMode,
      ...StyleSheet.absoluteFillObject
    }
  }

  applyHandlers([ backgroundSize, backgroundImage ],[imageProps, preImageInfo, imageSize, layoutInfo])
  if (!imageProps?.src) return null
  return imageProps
}


function preParseImage(imageStyle?: ExtendedViewStyle) {

  const { backgroundImage, backgroundSize = [ "auto" ] } = imageStyle || {}
  const src = parseUrl(backgroundImage)

  let sizeList = backgroundSize.slice() as DimensionValue []

  sizeList.length === 1 &&  sizeList.push(sizeList[0])

  return {
    src,
    sizeList
  }
}

function wrapImage(imageStyle?: ExtendedViewStyle) {
  const [show, setShow] = useState<boolean>(false)
  const [, setImageSizeWidth] = useState<number | null>(null)
  const [, setImageSizeHeight] = useState<number | null>(null)
  const [, setLayoutInfoWidth] = useState<number | null>(null)
  const [, setLayoutInfoHeight] = useState<number | null>(null)
  const sizeInfo = useRef<Size | null>(null)
  const layoutInfo = useRef<Size | null>(null)

  // 预解析
  const preImageInfo: PreImageInfo = preParseImage(imageStyle)


  // 判断是否可挂载onLayout
  const needLayout = checkNeedLayout(preImageInfo)
  const { src, sizeList } = preImageInfo

  useEffect(() => {
    if(!src) {
      setShow(false)
      sizeInfo.current = null
      layoutInfo.current = null
      return 
    }
  
    if (!sizeList.includes('auto')) {
      setShow(true)
      return
    }
    Image.getSize(src, (width, height) => {
      sizeInfo.current = {
        width,
        height
      }
      //1. 当需要绑定onLayout 2. 获取到布局信息
      if (!needLayout || layoutInfo.current) {
        setImageSizeWidth(width)
        setImageSizeHeight(height)
        if(layoutInfo.current) {
          setLayoutInfoWidth(layoutInfo.current.width)
          setLayoutInfoHeight(layoutInfo.current.height)
        }
        setShow(true)
      }
    })
  }, [preImageInfo?.src])

  if (!preImageInfo?.src) return null

  const onLayout = (res: LayoutChangeEvent) => {
    const { width, height } = res?.nativeEvent?.layout || {}
    layoutInfo.current = {
      width,
      height
    }
    if (sizeInfo.current) {
      setImageSizeWidth(sizeInfo.current.width)
      setImageSizeHeight(sizeInfo.current.height)
      setLayoutInfoWidth(width)
      setLayoutInfoHeight(height) 
      setShow(true)
    }
  }
  
  return <View key='viewBgImg' {...needLayout ? {onLayout} : null }   style={{ ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', overflow: 'hidden'}}>
    {show && <Image  {...imageStyleToProps(preImageInfo, sizeInfo.current as Size, layoutInfo.current as Size)} />}
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

function every(children: ReactNode [], callback: (children: ReactNode) => boolean) {
  return children.every((child) => callback(child))
}

function wrapChildren(children: ReactNode | ReactNode [] , textStyle?: StyleProp<TextStyle>, imageStyle?: ExtendedViewStyle) {
  children = Array.isArray(children) ? children : [children]
  if (every(children as ReactNode[], (child)=>isText(child))) {
    children = [<Text key='viewTextWrap' style={textStyle}>{children}</Text>]
  } else {
    if(textStyle) console.warn('Text style will be ignored unless every child of the view is Text node!')
  }

  return [
    wrapImage(imageStyle),
    ...children
  ]
}

const _View = forwardRef((props: _ViewProps, ref: ForwardedRef<View>): JSX.Element => {
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
  
    nodeRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
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
      {...innerProps}
      style={innerStyle}
    >
      {wrapChildren(children, textStyle, imageStyle)}
    </View>
  )
})

_View.displayName = 'mpx-view'

export default _View

