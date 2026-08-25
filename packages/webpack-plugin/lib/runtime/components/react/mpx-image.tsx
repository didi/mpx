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
import { hasOwn } from '@mpxjs/utils'
import { LocalSvg, SvgCssUri } from 'react-native-svg/css'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'
import { svgRegExp, useLayout, useTransformStyle, renderImage, extendObject, getImageLoadSize, isAndroid, hiddenStyle } from './utils'
import Portal from './mpx-portal'
import * as perf from '@mpxjs/perf'

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
  'parent-width'?: number
  'parent-height'?: number
  'enable-fast-image'?: boolean
  'is-svg'?: boolean
  bindload?: (evt: NativeSyntheticEvent<ImageLoadEventData> | unknown) => void
  binderror?: (evt: NativeSyntheticEvent<ImageErrorEventData> | unknown) => void
}

interface Size {
  width: number
  height: number
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

// 获取能完全显示图片的缩放比例：长宽方向的缩放比例最小值即为能完全展示的比例
function getFitScale (width1: number, height1: number, width2: number, height2: number) {
  return Math.min(width2 / width1, height2 / height1)
}

function getFillScale (width1: number, height1: number, width2: number, height2: number) {
  return Math.max(width2 / width1, height2 / height1)
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
  let idTotal = -1
  if (__mpx_perf_framework__) idTotal = perf.scopeStart('image:render')

  let idProps = -1
  if (__mpx_perf_framework__) idProps = perf.scopeStart('image:render:props')
  const {
    src = '',
    mode = 'scaleToFill',
    style = {},
    'enable-var': enableVar, 
    'enable-fast-image': enableFastImage = true,
    'parent-width': parentWidth,
    'parent-height': parentHeight,
    'is-svg': isSvgProp,
    bindload,
    binderror
  } = props

  const nodeRef = useRef(null)
  const srcRef = useRef('')
  const imageSizeRef = useRef<Record<string, Size>>({})
  const layoutInfoRef = useRef<Size | null>(null)
  const isLayoutModeRef = useRef(false)
  const [, setVersion] = useState(0)

  const resolvedSource = typeof src === 'string' ? undefined : RNImage.resolveAssetSource(src)
  const sourceKey = typeof src === 'string' ? src : resolvedSource?.uri || ''
  const isSvg = !!(isSvgProp || svgRegExp.test(typeof src === 'string' ? src : resolvedSource?.uri || ''))
  const imageSource = normalizeImageSource(src)
  const isWidthFixMode = mode === 'widthFix'
  const isHeightFixMode = mode === 'heightFix'
  const isCropMode = hasOwn(cropModeMap, mode)
  const isLayoutMode = isSvg || isWidthFixMode || isHeightFixMode || isCropMode
  const resizeMode: ImageResizeMode = hasOwn(modeResizeMap, mode) ? modeResizeMap[mode] : 'stretch'
  isLayoutModeRef.current = isLayoutMode
  srcRef.current = sourceKey

  const commitImageSize = (source: string, width: number, height: number) => {
    if (hasOwn(imageSizeRef.current, source)) return
    if (!(Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0)) return
    imageSizeRef.current[source] = { width, height }
    if (Object.is(srcRef.current, source) && isLayoutModeRef.current && layoutInfoRef.current) setVersion(version => version + 1)
  }

  const commitLayout = (width: number, height: number) => {
    if (!(Number.isFinite(width) && width >= 0 && Number.isFinite(height) && height >= 0)) return
    const current = layoutInfoRef.current
    if (current && Math.abs(current.width - width) < 0.5 && Math.abs(current.height - height) < 0.5) return
    layoutInfoRef.current = { width, height }
    if (isLayoutModeRef.current && hasOwn(imageSizeRef.current, srcRef.current)) setVersion(version => version + 1)
  }

  if (!hasOwn(imageSizeRef.current, sourceKey) && resolvedSource && Number.isFinite(resolvedSource.width) && resolvedSource.width > 0 && Number.isFinite(resolvedSource.height) && resolvedSource.height > 0) {
    imageSizeRef.current[sourceKey] = { width: resolvedSource.width, height: resolvedSource.height }
  }

  const styleObj = extendObject({}, style, OVERFLOW_HIDDEN_STYLE)

  if (__mpx_perf_framework__) perf.scopeEnd(idProps)

  let idStyle = -1
  if (__mpx_perf_framework__) idStyle = perf.scopeStart('image:render:style')
  const {
    hasPositionFixed,
    hasSelfPercent,
    normalStyle,
    setWidth,
    setHeight
  } = useTransformStyle(styleObj, { enableVar, transformRadiusPercent: isAndroid && !isLayoutMode, parentWidth, parentHeight, defaultStyle: DEFAULT_IMAGE_STYLE })

  // normalStyle 已合入 DEFAULT_IMAGE_STYLE，对外暴露完整 style（含 default 兜底的 width/height）
  useNodesRef(props, ref, nodeRef, {
    style: normalStyle
  })

  const { layoutRef, layoutStyle, layoutProps } = useLayout({
    props,
    hasSelfPercent,
    setWidth,
    setHeight,
    nodeRef,
    onLayout: isLayoutMode
      ? ({ nativeEvent: { layout: { width, height } } }: LayoutChangeEvent) => commitLayout(width, height)
      : undefined
  })

  const { width, height } = normalStyle
  const imageSize = imageSizeRef.current[sourceKey]
  const layoutInfo = layoutInfoRef.current
  const imageWidth = imageSize?.width || 0
  const imageHeight = imageSize?.height || 0
  const ratio = imageWidth ? imageHeight / imageWidth : 0
  let viewWidth = layoutInfo?.width || (isNumber(width) ? width : 0)
  let viewHeight = layoutInfo?.height || (isNumber(height) ? height : 0)
  if (imageSize && layoutInfo) {
    if (isWidthFixMode) viewHeight = getFixedHeight(viewWidth, viewHeight, ratio)
    if (isHeightFixMode) viewWidth = getFixedWidth(viewWidth, viewHeight, ratio)
  }
  const pending = isLayoutMode && (!imageSize || !layoutInfo)
  const modeStyle: ImageStyle = useMemo(() => {
    if (!isLayoutMode) return {}
    if (pending) {
      return hiddenStyle
    }
    if (!isSvg && !isCropMode) return BASE_IMAGE_FILL_STYLE
    let style: ImageStyle = {}
    switch (mode) {
      // SVG 的 scaleToFill 按小程序表现与 aspectFit 一致，均按完整显示比例缩放
      case 'scaleToFill':
      case 'aspectFit': {
        const scale = getFitScale(imageWidth, imageHeight, viewWidth, viewHeight)
        style = {
          transform: [
            { translateY: relativeCenteredSize(viewHeight, imageHeight * scale) },
            { translateX: relativeCenteredSize(viewWidth, imageWidth * scale) },
            { scale }
          ]
        }
        break
      }
      // SVG 按填满容器比例缩放
      case 'aspectFill': {
        const scale = getFillScale(imageWidth, imageHeight, viewWidth, viewHeight)
        style = {
          transform: [
            { translateY: relativeCenteredSize(viewHeight, imageHeight * scale) },
            { translateX: relativeCenteredSize(viewWidth, imageWidth * scale) },
            { scale }
          ]
        }
        break
      }
      // SVG 外层尺寸已按原图比例修正，仅需等比缩放
      case 'widthFix':
      case 'heightFix': {
        const scale = getFitScale(imageWidth, imageHeight, viewWidth, viewHeight)
        style = {
          transform: [{ scale }]
        }
        break
      }
      case 'top':
        style = {
          transform: [
            { translateX: relativeCenteredSize(viewWidth, imageWidth) }
          ]
        }
        break
      case 'bottom':
        style = {
          transform: [
            { translateY: viewHeight - imageHeight },
            { translateX: relativeCenteredSize(viewWidth, imageWidth) }
          ]
        }
        break
      case 'center':
        style = {
          transform: [
            { translateY: relativeCenteredSize(viewHeight, imageHeight) },
            { translateX: relativeCenteredSize(viewWidth, imageWidth) }
          ]
        }
        break
      case 'left':
        style = {
          transform: [
            { translateY: relativeCenteredSize(viewHeight, imageHeight) }
          ]
        }
        break
      case 'right':
        style = {
          transform: [
            { translateY: relativeCenteredSize(viewHeight, imageHeight) },
            { translateX: viewWidth - imageWidth }
          ]
        }
        break
      case 'top left':
        break
      case 'top right':
        style = {
          transform: [
            { translateX: viewWidth - imageWidth }
          ]
        }
        break
      case 'bottom left':
        style = {
          transform: [
            { translateY: viewHeight - imageHeight }
          ]
        }
        break
      case 'bottom right':
        style = {
          transform: [
            { translateY: viewHeight - imageHeight },
            { translateX: viewWidth - imageWidth }
          ]
        }
        break
      default:
        break
    }
    if (isSvg) return extendObject({}, SVG_TRANSFORM_ORIGIN_STYLE, style)
    return extendObject(
      { transformOrigin: 'left top', width: imageWidth, height: imageHeight },
      style
    )
  }, [pending, isSvg, mode, imageWidth, imageHeight, viewWidth, viewHeight])

  const onSvgLoad = (evt: LayoutChangeEvent) => {
    const { width, height } = evt.nativeEvent.layout
    commitImageSize(sourceKey, width, height)

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
    const { width, height } = getImageLoadSize(evt)
    // Android onLoad 返回渲染尺寸，图片真实尺寸仅通过 getSize 获取
    if (!isAndroid) commitImageSize(sourceKey, width, height)
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
    if (typeof src === 'string' && src && !isSvg && isLayoutMode && !hasOwn(imageSizeRef.current, sourceKey)) {
      RNImage.getSize(src, (width, height) => commitImageSize(sourceKey, width, height))
    }
  }, [src, isSvg, isLayoutMode])
  if (__mpx_perf_framework__) perf.scopeEnd(idStyle)

  let idInnerProps = -1
  if (__mpx_perf_framework__) idInnerProps = perf.scopeStart('image:render:innerProps')
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
          !pending && isHeightFixMode ? { width: viewWidth } : {},
          !pending && isWidthFixMode ? { height: viewHeight } : {}
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
  if (__mpx_perf_framework__) perf.scopeEnd(idInnerProps)

  function renderSvgImage () {
    const svgProps = {
      onLayout: onSvgLoad,
      style: modeStyle
    }
    return typeof src === 'string'
      ? createElement(SvgCssUri, extendObject({ uri: src, onError: binderror && onSvgError }, svgProps))
      : createElement(LocalSvg, extendObject({ asset: src }, svgProps))
  }

  function renderBaseImage (extraProps?: Record<string, any>) {
    return renderImage(
      extendObject(
        {
          source: imageSource,
          resizeMode: resizeMode,
          onLoad: onImageLoad,
          onError: binderror && onImageError,
          style: modeStyle
        },
        extraProps
      ),
      enableFastImage
    )
  }

  function renderLayout () {
    return createElement(View, innerProps, isSvg ? renderSvgImage() : renderBaseImage())
  }

  let idCreate = -1
  if (__mpx_perf_framework__) idCreate = perf.scopeStart('image:render:createElement')
  let finalComponent: JSX.Element = isLayoutMode ? renderLayout() : renderBaseImage(innerProps)

  if (hasPositionFixed) {
    finalComponent = createElement(Portal, null, finalComponent)
  }

  if (__mpx_perf_framework__) perf.scopeEnd(idCreate)
  if (__mpx_perf_framework__) perf.scopeEnd(idTotal)
  return finalComponent
})

Image.displayName = 'MpxImage'

export default Image
