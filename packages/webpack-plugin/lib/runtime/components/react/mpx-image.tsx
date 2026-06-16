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
  ImageLoadEventData,
  ImageSourcePropType
} from 'react-native'
import { hasOwn, noop } from '@mpxjs/utils'
import { LocalSvg, SvgCssUri } from 'react-native-svg/css'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { svgRegExp, useLayout, useTransformStyle, renderImage, extendObject, isAndroid } from './utils'
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
  src?: string | ImageSourcePropType
  mode?: Mode
  style?: ImageStyle & Record<string, any>
  'enable-offset'?: boolean
  'enable-var'?: boolean
  'parent-font-size'?: number
  'parent-width'?: number
  'parent-height'?: number
  'enable-fast-image'?: boolean
  'is-svg'?: boolean
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
const cropModeMap: Record<string, boolean> = {
  top: true,
  bottom: true,
  center: true,
  right: true,
  left: true,
  'top left': true,
  'top right': true,
  'bottom left': true,
  'bottom right': true
}

const modeResizeMap: Record<string, ImageResizeMode> = {
  scaleToFill: 'stretch',
  aspectFit: 'contain',
  aspectFill: 'cover',
  widthFix: 'stretch',
  heightFix: 'stretch',
  top: 'stretch',
  bottom: 'stretch',
  center: 'stretch',
  right: 'stretch',
  left: 'stretch',
  'top left': 'stretch',
  'top right': 'stretch',
  'bottom left': 'stretch',
  'bottom right': 'stretch'
}

const DEFAULT_IMAGE_STYLE: ImageStyle = {
  width: DEFAULT_IMAGE_WIDTH,
  height: DEFAULT_IMAGE_HEIGHT
}
const OVERFLOW_HIDDEN_STYLE = { overflow: 'hidden' as const }
const SVG_TRANSFORM_ORIGIN_STYLE = { transformOrigin: 'left top' as const }
const BASE_IMAGE_FILL_STYLE: ImageStyle = {
  transformOrigin: 'left top',
  width: '100%',
  height: '100%'
}

const isNumber = (value: DimensionValue): value is number => typeof value === 'number'

const relativeCenteredSize = (viewSize: number, imageSize: number) => {
  return (viewSize - imageSize) / 2
}

function normalizeImageSource (src: string | ImageSourcePropType): ImageSourcePropType {
  return typeof src === 'string' ? { uri: src } : src
}

function getImageUri (src: string | ImageSourcePropType) {
  return typeof src === 'string' ? src : RNImage.resolveAssetSource(src)?.uri || ''
}

function isSvgSource (src: string | ImageSourcePropType) {
  const uri = getImageUri(src)
  return svgRegExp.test(uri)
}

function getImageSize (src: string | ImageSourcePropType, success: (width: number, height: number) => void, fail: () => void = noop) {
  if (typeof src === 'string') {
    RNImage.getSize(src, success, fail)
    return
  }
  const source = RNImage.resolveAssetSource(src)
  if (source && source.width && source.height) {
    success(source.width, source.height)
  } else {
    fail()
  }
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
    'parent-font-size': parentFontSize,
    'enable-fast-image': enableFastImage,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    'is-svg': isSvgProp,
    bindload,
    binderror
  } = props

  const styleObj = extendObject(
    {},
    DEFAULT_IMAGE_STYLE,
    style,
    OVERFLOW_HIDDEN_STYLE
  )

  const nodeRef = useRef(null)
  useNodesRef(props, ref, nodeRef, {
    defaultStyle: DEFAULT_IMAGE_STYLE
  })

  const isSvg = useMemo(() => isSvgProp || isSvgSource(src), [isSvgProp, src])
  const imageSource = useMemo(() => normalizeImageSource(src), [src])
  const isWidthFixMode = mode === 'widthFix'
  const isHeightFixMode = mode === 'heightFix'
  const isCropMode = hasOwn(cropModeMap, mode)
  const isLayoutMode = isWidthFixMode || isHeightFixMode || isCropMode
  const resizeMode: ImageResizeMode = hasOwn(modeResizeMap, mode) ? modeResizeMap[mode] : 'stretch'

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
  } = useTransformStyle(styleObj, { enableVar, transformRadiusPercent: isAndroid && !isSvg && !isLayoutMode, parentFontSize, parentWidth, parentHeight })

  const { layoutRef, layoutStyle, layoutProps } = useLayout({
    props,
    hasSelfPercent,
    setWidth,
    setHeight,
    nodeRef,
    onLayout: isLayoutMode ? onLayout : undefined
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
    const triggerLoad = (width: number, height: number) => {
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
    }
    const { source } = evt.nativeEvent
    if (source && source.width && source.height) {
      triggerLoad(source.width, source.height)
      return
    }
    getImageSize(src, triggerLoad)
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
      getImageSize(
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
      'is-svg',
      'enable-fast-image',
      'bindload',
      'binderror'
    ],
    {
      layoutRef
    }
  )

  function renderSvgImage () {
    const svgProps = {
      onLayout: onSvgLoad,
      style: extendObject(
        {},
        SVG_TRANSFORM_ORIGIN_STYLE,
        modeStyle
      )
    }
    return createElement(
      View,
      innerProps,
      typeof src === 'string'
        ? createElement(SvgCssUri, extendObject({ uri: src, onError: binderror && onSvgError }, svgProps))
        : createElement(LocalSvg, extendObject({ asset: src }, svgProps))
    )
  }

  function renderBaseImage () {
    const baseImageStyle = isCropMode
      ? extendObject(
        { transformOrigin: 'left top', width: imageWidth, height: imageHeight },
        modeStyle
      )
      : BASE_IMAGE_FILL_STYLE
    return renderImage(
      extendObject(
        {
          source: imageSource,
          resizeMode: resizeMode,
          onLoad: bindload && onImageLoad,
          onError: binderror && onImageError,
          style: baseImageStyle
        },
        isLayoutMode ? {} : innerProps
      ),
      enableFastImage
    )
  }

  function renderLayoutImage () {
    return createElement(View, innerProps, loaded && renderBaseImage())
  }

  const finalComponent = isSvg ? renderSvgImage() : isLayoutMode ? renderLayoutImage() : renderBaseImage()

  if (hasPositionFixed) {
    return createElement(Portal, null, finalComponent)
  }

  return finalComponent
})

Image.displayName = 'MpxImage'

export default Image
