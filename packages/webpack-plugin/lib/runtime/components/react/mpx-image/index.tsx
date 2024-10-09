/**
 * ✔ src
 * - mode: Partially, Only SVG format do not support
 * ✘ show-menu-by-longpress
 * ✔ binderror
 * ✔ bindload
 * ✘ fade-in
 * ✔ webp
 * ✘ lazy-load
 * ✔ bindtap
 * ✔ DEFAULT_SIZE
 */
import { useEffect, useMemo, useState, useRef, forwardRef } from 'react'

import {
  Image as RNImage,
  View,
  ImageStyle,
  ImageSourcePropType,
  ImageResizeMode,
  StyleSheet,
  NativeSyntheticEvent,
  ImageErrorEventData,
  LayoutChangeEvent,
  DimensionValue,
  ImageLoadEventData
} from 'react-native'
import useInnerProps, { getCustomEvent } from '../getInnerListeners'
import useNodesRef, { HandlerRef } from '../useNodesRef'

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

export type SvgNumberProp = string | number | undefined

export interface ImageProps {
  src?: string
  mode?: Mode
  svg?: boolean
  style?: ImageStyle & Record<string, any>
  'enable-offset'?: boolean;
  bindload?: (evt: NativeSyntheticEvent<ImageLoadEventData> | unknown) => void
  binderror?: (evt: NativeSyntheticEvent<ImageErrorEventData> | unknown) => void
}

const DEFAULT_IMAGE_WIDTH = 320
const DEFAULT_IMAGE_HEIGHT = 240
// const REMOTE_SVG_REGEXP = /https?:\/\/.*\.(?:svg)/i

// const styls = StyleSheet.create({
//   suspense: {
//     display: 'flex',
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: '100%',
//     height: '100%',
//   },
// })

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

const isNumber = (value: DimensionValue) => typeof value === 'number'

const relativeCenteredSize = (viewSize: number, imageSize: number) => (viewSize - imageSize) / 2

// const Svg = lazy(() => import('./svg'))

// const Fallback = (
//   <View style={styls.suspense}>
//     <Text>loading ...</Text>
//   </View>
// )

const Image = forwardRef<HandlerRef<RNImage, ImageProps>, ImageProps>((props, ref): JSX.Element => {
  const {
    src = '',
    mode = 'scaleToFill',
    // svg = false,
    style = {},
    'enable-offset': enableOffset,
    bindload,
    binderror
  } = props

  const { width = DEFAULT_IMAGE_WIDTH, height = DEFAULT_IMAGE_HEIGHT } = style as ImageStyle

  const { nodeRef } = useNodesRef(props, ref, {
    defaultStyle: {
      width: DEFAULT_IMAGE_WIDTH,
      height: DEFAULT_IMAGE_HEIGHT
    }
  })

  const layoutRef = useRef({})
  const preSrc = useRef<string | undefined>()

  const resizeMode: ImageResizeMode = ModeMap.get(mode) || 'stretch'
  const isWidthFixMode = mode === 'widthFix'
  const isHeightFixMode = mode === 'heightFix'
  const isCropMode = cropMode.includes(mode)

  const source: ImageSourcePropType = typeof src === 'string' ? { uri: src } : src

  const [viewWidth, setViewWidth] = useState(isNumber(width) ? (width as number) : 0)
  const [viewHeight, setViewHeight] = useState(isNumber(height) ? (height as number) : 0)
  const [imageWidth, setImageWidth] = useState(0)
  const [imageHeight, setImageHeight] = useState(0)
  const [ratio, setRatio] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const fixedHeight = useMemo(() => {
    const fixed = viewWidth * ratio
    return !fixed ? viewHeight : fixed
  }, [ratio, viewWidth, viewHeight])

  const fixedWidth = useMemo(() => {
    if (!ratio) return viewWidth
    const fixed = viewHeight / ratio
    return !fixed ? viewWidth : fixed
  }, [ratio, viewWidth, viewHeight])

  const cropModeStyle: ImageStyle = useMemo(() => {
    switch (mode) {
      case 'top':
        return { top: 0, left: relativeCenteredSize(viewWidth, imageWidth) }
      case 'bottom':
        return { top: 'auto', bottom: 0, left: relativeCenteredSize(viewWidth, imageWidth) }
      case 'center':
        return { top: relativeCenteredSize(viewHeight, imageHeight), left: relativeCenteredSize(viewWidth, imageWidth) }
      case 'left':
        return { top: relativeCenteredSize(viewHeight, imageHeight), left: 0 }
      case 'right':
        return { top: relativeCenteredSize(viewHeight, imageHeight), left: 'auto', right: 0 }
      case 'top left':
        return { top: 0, left: 0 }
      case 'top right':
        return { top: 0, left: 'auto', right: 0 }
      case 'bottom left':
        return { top: 'auto', bottom: 0, left: 0 }
      case 'bottom right':
        return { top: 'auto', bottom: 0, left: 'auto', right: 0 }
      default:
        return {}
    }
  }, [mode, viewWidth, viewHeight, imageWidth, imageHeight])

  const onImageLoad = (evt: NativeSyntheticEvent<ImageLoadEventData>) => {
    if (!bindload) return
    if (typeof src === 'string') {
      evt.persist()
      RNImage.getSize(src, (width: number, height: number) => {
        bindload(
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
    } else {
      const { width = 0, height = 0 } = RNImage.resolveAssetSource(src) || {}
      bindload(
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
  }

  const onImageError = (evt: NativeSyntheticEvent<ImageErrorEventData>) => {
    binderror &&
      binderror(
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

  const onViewLayout = ({
    nativeEvent: {
      layout: { width, height }
    }
  }: LayoutChangeEvent) => {
    setViewWidth(width)
    setViewHeight(height)
  }

  const onImageLayout = () => {
    nodeRef.current?.measure((x: number, y: number, width: number, height: number, offsetLeft: number, offsetTop: number) => {
      layoutRef.current = { x, y, width, height, offsetLeft, offsetTop }
    })
  }

  useEffect(() => {
    if (!isWidthFixMode && !isHeightFixMode && !isCropMode) {
      setLoaded(true)
      return
    }

    const changed = preSrc.current !== src
    preSrc.current = src
    changed && setLoaded(false)

    if (typeof src === 'string') {
      RNImage.getSize(src, (width: number, height: number) => {
        if (isWidthFixMode || isHeightFixMode) {
          setRatio(width === 0 ? 0 : height / width)
        }
        if (isCropMode) {
          setImageWidth(width)
          setImageHeight(height)
        }
        changed && setLoaded(true)
      })
    } else {
      const { width = 0, height = 0 } = RNImage.resolveAssetSource(src) || {}
      if (isWidthFixMode || isHeightFixMode) {
        setRatio(width === 0 ? 0 : height / width)
      }
      if (isCropMode) {
        setImageWidth(width)
        setImageHeight(height)
      }
      changed && setLoaded(true)
    }
  }, [isWidthFixMode, isHeightFixMode, isCropMode, src])

  const innerProps = useInnerProps(props, {
    ref: nodeRef,
    ...(enableOffset ? { onLayout: onImageLayout } : {})
  },
    [
      'enable-offset'
    ],
    {
      layoutRef
    }
  )

  // if (typeof src === 'string' && REMOTE_SVG_REGEXP.test(src)) {
  //   return (
  //     <Suspense fallback={Fallback} {...innerProps}>
  //       <View {...innerProps}>
  //         <Svg src={src} style={style} width={width as SvgNumberProp} height={height as SvgNumberProp} />
  //       </View>
  //     </Suspense>
  //   )
  // }

  // if (svg) {
  //   return (
  //     <Suspense fallback={Fallback}>
  //       <View {...innerProps}>
  //         <Svg local src={src} style={style} width={width as SvgNumberProp} height={height as SvgNumberProp} />
  //       </View>
  //     </Suspense>
  //   )
  // }

  return (
    <View
      style={{
        width,
        height,
        ...style,
        ...(isHeightFixMode && { width: fixedWidth }),
        ...(isWidthFixMode && { height: fixedHeight }),
        overflow: 'hidden'
      }}
      onLayout={onViewLayout}>
      {
        loaded && <RNImage
          {...innerProps}
          source={source}
          resizeMode={resizeMode}
          onLoad={onImageLoad}
          onError={onImageError}
          style={{
            ...StyleSheet.absoluteFillObject,
            width: !isCropMode ? '100%' : imageWidth,
            height: !isCropMode ? '100%' : imageHeight,
            ...(isCropMode && cropModeStyle)
          }}
        />
      }
    </View>
  )
})

Image.displayName = 'MpxImage'

export default Image
