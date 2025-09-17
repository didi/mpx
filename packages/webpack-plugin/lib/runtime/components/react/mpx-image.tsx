/**
 * ✔ src
 * ✔ mode
 * ✘ show-menu-by-longpress
 * ✔ binderror
 * ✔ bindload
 * ✘ fade-in
 * ✔ webp
 * ✘ lazy-load
 * ✔ bindtap
 * ✔ DEFAULT_SIZE
 */
import { useEffect, useMemo, useState, useRef, forwardRef, createElement } from 'react'
import {
  Image as RNImage,
  View,
  ImageStyle,
  ImageResizeMode,
  NativeSyntheticEvent,
  ImageErrorEventData,
  LayoutChangeEvent,
  DimensionValue,
  ImageLoadEventData
} from 'react-native'
import { noop } from '@mpxjs/utils'
import { SvgCssUri } from 'react-native-svg/css'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { SVG_REGEXP, useLayout, useTransformStyle, renderImage, extendObject } from './utils'
import Portal from './mpx-portal'

export type Mode =
  | 'scaleToFill'
  | 'aspectFit'
  | 'aspectFill'
  | 'widthFix'
  | 'heightFix'
  | 'top'
  | 'bottom'
  | 'center'
  | 'left'
  | 'right'
  | 'top left'
  | 'top right'
  | 'bottom left'
  | 'bottom right'

export interface ImageProps {
  src?: string
  mode?: Mode
  svg?: boolean
  style?: ImageStyle & Record<string, any>
  'enable-offset'?: boolean
  'enable-var'?: boolean
  'external-var-context'?: Record<string, any>
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
  'enable-fast-image'?: boolean
  bindload?: (evt: NativeSyntheticEvent<ImageLoadEventData> | unknown) => void
  binderror?: (evt: NativeSyntheticEvent<ImageErrorEventData> | unknown) => void
}

interface ImageState {
  viewWidth: number
  viewHeight: number
  imageWidth?: number
  imageHeight?: number
  ratio?: number
}

const DEFAULT_IMAGE_WIDTH = 320
const DEFAULT_IMAGE_HEIGHT = 240

const cropMode: Mode[] = [
  'top',
  'bottom',
  'center',
  'right',
  'left',
  'top left',
  'top right',
  'bottom left',
  'bottom right'
]

const ModeMap = new Map<Mode, ImageResizeMode | undefined>([
  ['scaleToFill', 'stretch'],
  ['aspectFit', 'contain'],
  ['aspectFill', 'cover'],
  ['widthFix', 'stretch'],
  ['heightFix', 'stretch'],
  ...cropMode.map<[Mode, ImageResizeMode]>(mode => [mode, 'stretch'])
])

const isNumber = (value: DimensionValue): value is number => typeof value === 'number'

const relativeCenteredSize = (viewSize: number, imageSize: number) => {
  return (viewSize - imageSize) / 2
}

// 获取能完全显示图片的缩放比例：长宽方向的缩放比例最小值即为能完全展示的比例
function getFitScale (width1: number, height1: number, width2: number, height2: number) {
  return Math.min(width2 / width1, height2 / height1)
}

function getFillScale (width1: number, height1: number, width2: number, height2: number) {
  return Math.max(width2 / width1, height2 / height1)
}

function noMeetCalcRule (isSvg: boolean, mode: Mode, viewWidth: number, viewHeight: number, ratio: number) {
  const isMeetSize = viewWidth && viewHeight && ratio
  if (isSvg && !isMeetSize) return true
  if (!isSvg && !['scaleToFill', 'aspectFit', 'aspectFill'].includes(mode) && !isMeetSize) return true
  return false
}

const getFixedWidth = (viewWidth: number, viewHeight: number, ratio: number) => {
  if (!ratio) return viewWidth
  const fixed = viewHeight / ratio
  return !fixed ? viewWidth : fixed
}

const getFixedHeight = (viewWidth: number, viewHeight: number, ratio: number) => {
  const fixed = viewWidth * ratio
  return !fixed ? viewHeight : fixed
}

const Image = forwardRef<HandlerRef<RNImage, ImageProps>, ImageProps>((props, ref): JSX.Element => {
  const {
    src = '',
    mode = 'scaleToFill',
    style = {},
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'enable-fast-image': enableFastImage,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    bindload,
    binderror
  } = props

  const defaultStyle = {
    width: DEFAULT_IMAGE_WIDTH,
    height: DEFAULT_IMAGE_HEIGHT
  }

  const styleObj = extendObject(
    {},
    defaultStyle,
    style,
    { overflow: 'hidden' }
  )

  const nodeRef = useRef(null)
  useNodesRef(props, ref, nodeRef, {
    defaultStyle
  })

  const isSvg = SVG_REGEXP.test(src)
  const isWidthFixMode = mode === 'widthFix'
  const isHeightFixMode = mode === 'heightFix'
  const isCropMode = cropMode.includes(mode)
  const isLayoutMode = isWidthFixMode || isHeightFixMode || isCropMode
  const resizeMode: ImageResizeMode = ModeMap.get(mode) || 'stretch'

  const onLayout = ({ nativeEvent: { layout: { width, height } } }: LayoutChangeEvent) => {
    state.current.viewWidth = width
    state.current.viewHeight = height
    // 实际渲染尺寸可能会指定的值不一致，误差低于 0.5 则认为没有变化
    if (Math.abs(viewHeight - height) < 0.5 && Math.abs(viewWidth - width) < 0.5) {
      if (state.current.imageWidth && state.current.imageHeight && state.current.ratio) {
        if (!loaded) setLoaded(true)
      }
      return
    }
    if (state.current.imageWidth && state.current.imageHeight && state.current.ratio) {
      setRatio(state.current.ratio)
      setImageWidth(state.current.imageWidth)
      setImageHeight(state.current.imageHeight)
      setViewSize(state.current.viewWidth!, state.current.viewHeight!, state.current.ratio!)
      setLoaded(true)
    }
  }

  const {
    hasPositionFixed,
    hasSelfPercent,
    normalStyle,
    setWidth,
    setHeight
  } = useTransformStyle(styleObj, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const { layoutRef, layoutStyle, layoutProps } = useLayout({
    props,
    hasSelfPercent,
    setWidth,
    setHeight,
    nodeRef,
    onLayout: isLayoutMode ? onLayout : noop
  })

  const { width, height } = normalStyle

  const [viewWidth, setViewWidth] = useState(isNumber(width) ? width : 0)
  const [viewHeight, setViewHeight] = useState(isNumber(height) ? height : 0)
  const [imageWidth, setImageWidth] = useState(0)
  const [imageHeight, setImageHeight] = useState(0)
  const [ratio, setRatio] = useState(0)
  const [loaded, setLoaded] = useState(!isLayoutMode)

  const state = useRef<ImageState>({
    viewWidth,
    viewHeight
  })

  console.log(`==========render Image viewWidth:${viewWidth} viewHeight:${viewHeight} imageWidth:${imageWidth} imageHeight:${imageHeight} ratio:${ratio} loaded:${loaded}`)

  function setViewSize (viewWidth: number, viewHeight: number, ratio: number) {
    // 在特定模式下可预测 view 的变化，在onLayout触发时能以此避免重复render
    switch (mode) {
      case 'widthFix': {
        setViewWidth(viewWidth)
        const fixedHeight = getFixedHeight(viewWidth, viewHeight, ratio)
        setViewHeight(fixedHeight)
        break
      }
      case 'heightFix': {
        setViewHeight(viewHeight)
        const fixedWidth = getFixedWidth(viewWidth, viewHeight, ratio)
        setViewWidth(fixedWidth)
        break
      }
      default:
        setViewHeight(viewHeight)
        setViewWidth(viewWidth)
        break
    }
  }

  const modeStyle: ImageStyle = useMemo(() => {
    if (noMeetCalcRule(isSvg, mode, viewWidth, viewHeight, ratio)) return {}
    switch (mode) {
      case 'scaleToFill': // wx 中 svg 图片的 scaleToFill 模式效果与 aspectFit 一致，不会就行图片缩放，此处保持一致
      case 'aspectFit':
        if (isSvg) {
          const scale = getFitScale(imageWidth, imageHeight, viewWidth, viewHeight)
          return {
            transform: [
              { translateY: relativeCenteredSize(viewHeight, imageHeight * scale) },
              { translateX: relativeCenteredSize(viewWidth, imageWidth * scale) },
              { scale }
            ]
          }
        }
        return {}
      case 'aspectFill':
        if (isSvg) {
          const scale = getFillScale(imageWidth, imageHeight, viewWidth, viewHeight)
          return {
            transform: [
              { translateY: relativeCenteredSize(viewHeight, imageHeight * scale) },
              { translateX: relativeCenteredSize(viewWidth, imageWidth * scale) },
              { scale }
            ]
          }
        }
        return {}
      case 'widthFix':
      case 'heightFix':
        if (isSvg) {
          const scale = getFitScale(imageWidth, imageHeight, viewWidth, viewHeight)
          return {
            transform: [{ scale }]
          }
        }
        return {}
      case 'top':
        return {
          transform: [
            { translateX: relativeCenteredSize(viewWidth, imageWidth) }
          ]
        }
      case 'bottom':
        return {
          transform: [
            { translateY: viewHeight - imageHeight },
            { translateX: relativeCenteredSize(viewWidth, imageWidth) }
          ]
        }
      case 'center':
        return {
          transform: [
            { translateY: relativeCenteredSize(viewHeight, imageHeight) },
            { translateX: relativeCenteredSize(viewWidth, imageWidth) }
          ]
        }
      case 'left':
        return {
          transform: [
            { translateY: relativeCenteredSize(viewHeight, imageHeight) }
          ]
        }
      case 'right':
        return {
          transform: [
            { translateY: relativeCenteredSize(viewHeight, imageHeight) },
            { translateX: viewWidth - imageWidth }
          ]
        }
      case 'top left':
        return {}
      case 'top right':
        return {
          transform: [
            { translateX: viewWidth - imageWidth }
          ]
        }
      case 'bottom left':
        return {
          transform: [
            { translateY: viewHeight - imageHeight }
          ]
        }
      case 'bottom right':
        return {
          transform: [
            { translateY: viewHeight - imageHeight },
            { translateX: viewWidth - imageWidth }
          ]
        }
      default:
        return {}
    }
  }, [isSvg, mode, viewWidth, viewHeight, imageWidth, imageHeight, ratio])

  const onSvgLoad = (evt: LayoutChangeEvent) => {
    const { width, height } = evt.nativeEvent.layout
    state.current.imageHeight = height
    setImageHeight(height)
    state.current.ratio = !width ? 0 : height / width

    if (isWidthFixMode
      ? state.current.viewWidth
      : isHeightFixMode
        ? state.current.viewHeight
        : state.current.viewWidth && state.current.viewHeight) {
      setRatio(state.current.ratio)
      setImageWidth(width)
      setImageHeight(height)
      setViewSize(state.current.viewWidth!, state.current.viewHeight!, state.current.ratio)
      setLoaded(true)
    }

    bindload && bindload(
      getCustomEvent(
        'load',
        evt,
        {
          detail: { width, height },
          layoutRef
        },
        props
      )
    )
  }

  const onSvgError = (evt: Error) => {
    binderror!(
      getCustomEvent(
        'error',
        evt,
        {
          detail: { errMsg: evt?.message },
          layoutRef
        },
        props
      )
    )
  }

  const onImageLoad = (evt: NativeSyntheticEvent<ImageLoadEventData>) => {
    evt.persist()
    RNImage.getSize(src, (width: number, height: number) => {
      bindload!(
        getCustomEvent(
          'load',
          evt,
          {
            detail: { width, height },
            layoutRef
          },
          props
        )
      )
    })
  }

  const onImageError = (evt: NativeSyntheticEvent<ImageErrorEventData>) => {
    binderror!(
      getCustomEvent(
        'error',
        evt,
        {
          detail: { errMsg: evt.nativeEvent.error },
          layoutRef
        },
        props
      )
    )
  }

  useEffect(() => {
    if (!isSvg && isLayoutMode) {
      RNImage.getSize(
        src,
        (width: number, height: number) => {
          state.current.imageWidth = width
          state.current.imageHeight = height
          state.current.ratio = !width ? 0 : height / width

          if (isWidthFixMode
            ? state.current.viewWidth
            : isHeightFixMode
              ? state.current.viewHeight
              : state.current.viewWidth && state.current.viewHeight) {
            setRatio(state.current.ratio)
            setImageWidth(width)
            setImageHeight(height)
            setViewSize(state.current.viewWidth!, state.current.viewHeight!, state.current.ratio!)

            setLoaded(true)
          }
        },
        () => {
          setLoaded(true)
        }
      )
    }
  }, [src, isSvg, isLayoutMode])

  const innerProps = useInnerProps(
    extendObject(
      {},
      props,
      layoutProps,
      {
        ref: nodeRef,
        style: extendObject(
          {},
          normalStyle,
          layoutStyle,
          isHeightFixMode ? { width: viewWidth } : {},
          isWidthFixMode ? { height: viewHeight } : {}
        )
      }
    ),
    [
      'src',
      'mode',
      'svg'
    ],
    {
      layoutRef
    }
  )

  const SvgImage = createElement(
    View,
    innerProps,
    createElement(SvgCssUri, {
      uri: src,
      onLayout: onSvgLoad,
      onError: binderror && onSvgError,
      style: extendObject(
        { transformOrigin: 'left top' },
        modeStyle
      )
    })
  )

  const BaseImage = renderImage(
    extendObject(
      {
        source: { uri: src },
        resizeMode: resizeMode,
        onLoad: bindload && onImageLoad,
        onError: binderror && onImageError,
        style: extendObject(
          {
            transformOrigin: 'left top',
            width: isCropMode ? imageWidth : '100%',
            height: isCropMode ? imageHeight : '100%'
          },
          isCropMode ? modeStyle : {}
        )
      },
      isLayoutMode ? {} : innerProps
    ),
    enableFastImage
  )

  const LayoutImage = createElement(View, innerProps, loaded && BaseImage)

  const finalComponent = isSvg ? SvgImage : isLayoutMode ? LayoutImage : BaseImage

  if (hasPositionFixed) {
    return createElement(Portal, null, finalComponent)
  }

  return finalComponent
})

Image.displayName = 'mpx-image'

export default Image
