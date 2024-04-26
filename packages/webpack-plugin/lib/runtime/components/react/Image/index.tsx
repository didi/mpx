import React, { lazy, useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react'
import {
  Image as RNImage,
  View,
  Text,
  ImageStyle,
  StyleProp,
  ImageSourcePropType,
  ImageResizeMode,
  StyleSheet,
  NativeSyntheticEvent,
  ImageErrorEventData,
} from 'react-native'
import type { Event } from '../types'
import { omit } from '../utils'

export type Mode = 'aspectFill' | 'aspectFit' | 'scaleToFill' | 'center' | 'widthFix'

type ImageErrorEvent = NativeSyntheticEvent<ImageErrorEventData>

type LoadEventData = {
  width: number
  height: number
}

type LoadErrorData = {
  errMsg: string
}

export interface ImageProps {
  src?: string
  mode?: Mode
  svg?: boolean
  style?: StyleProp<ImageStyle>
  onLoad?: (event: Event<LoadEventData>) => void
  onError?: (event: Event<LoadErrorData>) => void
}

const DEFAULT_IMAGE_WIDTH = 240
const DEFAULT_IMAGE_HEIGHT = 320
const REMOTE_SVG_REGEXP = /https?:\/\/.*\.(?:svg)/i

const ModeMap = new Map<Mode, ImageResizeMode | undefined>([
  ['aspectFill', 'cover'],
  ['aspectFit', 'contain'],
  ['scaleToFill', 'stretch'],
  ['center', 'center'],
  ['widthFix', undefined],
])

const Image = (props: ImageProps): React.JSX.Element => {
  const { src = '', mode = 'scaleToFill', svg = false, style, onLoad, onError, ...restProps } = omit(props, ['source', 'resizeeMode'])

  const { width = DEFAULT_IMAGE_WIDTH, height = DEFAULT_IMAGE_HEIGHT } = StyleSheet.flatten(style)
  const source: ImageSourcePropType = typeof src === 'string' ? { uri: src } : src
  const mapMode = ModeMap.get(mode)
  const isWidthFixMode = mode === 'widthFix'

  const Svg = lazy(() => import('./Svg'))

  const preMode = useRef(mapMode || 'cover')

  const [ratio, setRatio] = useState(0)

  const resizeMode: ImageResizeMode = useMemo(() => (mapMode ? mapMode : preMode.current), [mapMode])

  const fixedHeight = useMemo(() => {
    const fixed = (width as number) * ratio
    return fixed === 0 ? height : fixed
  }, [ratio, width, height])

  const onImageLoad = useCallback(() => {
    if (!onLoad) return
    if (typeof src === 'string') {
      RNImage.getSize(src, (width: number, height: number) => {
        onLoad({ detail: { width, height } })
      })
    } else {
      const { width = 0, height = 0 } = RNImage.resolveAssetSource(src) || {}
      onLoad({ detail: { width, height } })
    }
  }, [onLoad, src])

  const onImageError = useCallback(
    ({ nativeEvent }: ImageErrorEvent) => {
      if (!onError) return
      onError({
        detail: { errMsg: nativeEvent.error },
      })
    },
    [onError]
  )

  const loadImg = useCallback((): void => {
    if (!isWidthFixMode) return
    if (typeof src === 'string') {
      RNImage.getSize(src, (width: number, height: number) => {
        setRatio(width === 0 ? 0 : height / width)
      })
    } else {
      const { width = 0, height = 0 } = RNImage.resolveAssetSource(src) || {}
      setRatio(width === 0 ? 0 : height / width)
    }
  }, [isWidthFixMode, src])

  useEffect(() => {
    if (mapMode) {
      preMode.current = mapMode
    }
  }, [mapMode])

  useEffect(() => loadImg(), [loadImg])

  if (typeof src === 'string' && REMOTE_SVG_REGEXP.test(src)) {
    return (
      <Suspense
        fallback={
          <View style={{ width, height }}>
            <Text>loading ...</Text>
          </View>
        }>
        <Svg src={src} width={width as number} height={height as number} />
      </Suspense>
    )
  }

  if (svg) {
    return (
      <Suspense
        fallback={
          <View style={{ width, height }}>
            <Text>loading ...</Text>
          </View>
        }>
        <Svg local src={src} width={width as number} height={height as number} />
      </Suspense>
    )
  }

  return (
    <RNImage
      testID="image"
      source={source}
      resizeMode={resizeMode}
      onLoad={onImageLoad}
      onError={onImageError}
      style={[
        { width, height },
        style,
        {
          ...(isWidthFixMode && { height: fixedHeight }),
        },
      ]}
      {...restProps}
    />
  )
}

export default Image
