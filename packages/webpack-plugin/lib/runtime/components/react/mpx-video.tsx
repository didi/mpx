/**
 * ✔ src
 * ✘ duration
 * ✔ controls
 * ✘ danmu-list
 * ✘ danmu-btn
 * ✘ enable-danmu
 * ✔ autoplay
 * ✔ loop
 * ✔ muted
 * ✔ initial-time
 * ✘ page-gesture
 * ✘ direction
 * ✘ show-progress
 * ✘ show-fullscreen-btn
 * ✘ show-play-btn
 * ✘ show-center-play-btn
 * ✘ enable-progress-gesture
 * ✔ object-fit
 * ✔ poster
 * ✘ show-mute-btn
 * ✘ title
 * ✘ play-btn-position
 * ✘ enable-play-gesture
 * ✘ auto-pause-if-navigate
 * ✘ auto-pause-if-open-native
 * ✘ vslide-gesture
 * ✘ vslide-gesture-in-fullscreen
 * ✘ show-bottom-progress(use show-progress)
 * ✘ ad-unit-id
 * ✘ poster-for-crawler
 * ✘ show-casting-button
 * ✘ picture-in-picture-mode
 * ✘ picture-in-picture-show-progress
 * ✘ picture-in-picture-init-position
 * ✔ enable-auto-rotation (only ios)
 * ✘ show-screen-lock-button
 * ✘ show-snapshot-button
 * ✘ show-background-playback-button
 * ✘ background-poster
 * ✘ referrer-policy
 * ✔ is-drm
 * ✘ is-live
 * ✔ provision-url(android)
 * ✔ certificate-url(ios)
 * ✔ license-url
 * ✔ preferred-peak-bit-rate
 * ✔ bindplay
 * ✔ bindpause
 * ✔ bindended
 * ✘ bindtimeupdate
 * ✔ bindfullscreenchange
 * ✔ bindwaiting
 * ✔ binderror
 * ✔ bindprogress
 * ✔ bindloadedmetadata
 * ✔ bindcontrolstoggle(only android)
 * ✘ bindenterpictureinpicture
 * ✘ bindleavepictureinpicture
 * ✔ bindseekcomplete
 * ✘ bindcastinguserselect
 * ✘ bindcastingstatechange
 * ✘ bindcastinginterrupt
 */

import { JSX, useRef, forwardRef, createElement } from 'react'
import Video, { DRMType, ReactVideoSourceProperties } from 'react-native-video'
import { StyleSheet, View, Platform, ViewStyle } from 'react-native'
import {
  splitProps,
  useTransformStyle,
  useLayout,
  extendObject
} from './utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'

interface VideoProps {
  src: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  initialTime?: number;
  controls?: boolean;
  poster?: string;
  style?: ViewStyle;
  'object-fit'?: null | 'contain' | 'fill' | 'cover';
  'is-drm'?: boolean;
  'provision-url'?: string;
  'certificate-url'?: string;
  'license-url'?: string;
  'preferred-peak-bit-rate'?: number;
  'enable-auto-rotation'?: number;
  'enable-var'?: boolean;
  'external-var-context'?: Record<string, any>;
  'parent-font-size'?: number;
  'parent-width'?: number;
  'parent-height'?: number;
  bindplay?: (event: Record<string, any>) => void;
  bindpause?: (event: Record<string, any>) => void;
  bindended?: (event: Record<string, any>) => void;
  bindtimeupdate?: (event: Record<string, any>) => void;
  bindfullscreenchange?: (event: Record<string, any>) => void;
  bindwaiting?: (event: Record<string, any>) => void;
  binderror?: (event: Record<string, any>) => void;
  bindprogress?: (event: Record<string, any>) => void;
  bindloadedmetadata?: (event: Record<string, any>) => void;
  bindcontrolstoggle?: (event: Record<string, any>) => void;
  bindseekcomplete?: (event: Record<string, any>) => void;
}

const styles = StyleSheet.create({
  video: {
    width: 300,
    height: 225
  }
})

const MpxVideo = forwardRef<HandlerRef<ScrollView & View, VideoProps>, VideoProps>((videoProps: VideoProps, ref): JSX.Element => {
  const { innerProps: props = {} } = splitProps(videoProps)
  const {
    src,
    autoplay = false,
    loop = false,
    muted = false,
    initialTime = 0,
    controls = true,
    poster = '',
    bindplay,
    bindpause,
    bindended,
    bindtimeupdate,
    bindfullscreenchange,
    bindwaiting,
    binderror,
    bindprogress,
    bindloadedmetadata,
    bindcontrolstoggle,
    bindseekcomplete,
    style,
    'object-fit': objectFit = 'contain',
    'is-drm': isDrm = false,
    'provision-url': provisionUrl,
    'certificate-url': certificateUrl,
    'license-url': licenseUrl,
    'preferred-peak-bit-rate': preferredPeakBitRate = 0,
    'enable-auto-rotation': enableAutoRotation = false,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight
  } = props

  const videoRef = useRef(null)

  const propsRef = useRef({})

  propsRef.current = props

  const { normalStyle, hasSelfPercent, setWidth, setHeight } =
    useTransformStyle(extendObject(styles.video, style), {
      enableVar,
      externalVarContext,
      parentFontSize,
      parentWidth,
      parentHeight
    })

  const { layoutRef, layoutStyle, layoutProps } = useLayout({
    props,
    hasSelfPercent,
    setWidth,
    setHeight,
    nodeRef: videoRef
  })

  useNodesRef(props, ref, videoRef, {
    style: normalStyle,
    node: {
      play,
      pause,
      stop,
      seek,
      requestFullScreen,
      exitFullScreen
    }
  })
  const videoInfoRef = useRef({})

  // 处理播放进度更新
  const bufferedPercentage = useRef(0)
  function handleProgress (data) {
    const { playableDuration, seekableDuration, currentTime } = data
    bindtimeupdate && bindtimeupdate(
      getCustomEvent('timeupdate',
        {},
        {
          detail: {
            currentTime,
            duration: videoInfoRef.current.duration
          },
          layoutRef
        },
        propsRef.current
      )
    )

    if (seekableDuration > 0) {
      // 计算缓冲的百分比
      const currentBufferedPercentage = (playableDuration / seekableDuration) * 100
      if (currentBufferedPercentage !== bufferedPercentage.current) {
        bufferedPercentage.current = currentBufferedPercentage
        bindprogress && bindprogress(
          getCustomEvent('progress',
            {},
            {
              detail: {
                buffered: bufferedPercentage.current
              },
              layoutRef
            },
            propsRef.current
          ))
      }
    }
  }

  // 处理播放结束
  function handleEnd () {
    bindended!(getCustomEvent('end', {}, { layoutRef }, propsRef.current))
  }

  // 处理等待
  function handleWaiting ({ isBuffering }) {
    if (isBuffering) {
      bindwaiting!(getCustomEvent('waiting', {}, { layoutRef }, propsRef.current))
    }
  }

  // 处理seek完成
  function handleSeekcomplete (data) {
    bindseekcomplete!(
      getCustomEvent('seekcomplete',
        {},
        {
          detail: {
            position: data.seekTime
          },
          layoutRef
        },
        propsRef.current
      ))
  }

  function handleEnterFullScreen () {
    bindfullscreenchange && bindfullscreenchange(
      getCustomEvent('fullscreenchange', {}, { detail: { fullScreen: 1 }, layoutRef }, propsRef.current)
    )
  }

  function handleExitFullScreen () {
    bindfullscreenchange && bindfullscreenchange(
      getCustomEvent('fullscreenchange', {}, { detail: { fullScreen: 0 }, layoutRef }, propsRef.current)
    )
  }

  function handlePlaybackRateChange (data) {
    if (data.playbackRate === 0) {
      bindpause && bindpause(getCustomEvent('pause', {}, { layoutRef }, propsRef.current))
    } else {
      bindplay && bindplay(getCustomEvent('play', {}, { layoutRef }, propsRef.current))
    }
  }

  function handleAndroidControlsVisibilityChange (data) {
    bindcontrolstoggle!(
      getCustomEvent('progress',
        {},
        {
          detail: {
            show: data.isVisible
          },
          layoutRef
        },
        propsRef.current
      ))
  }

  function handleVideoLoad (data) {
    const { naturalSize, duration } = data
    if (autoplay) {
      videoRef.current.seek(initialTime)
    }
    videoInfoRef.current = data
    bindloadedmetadata && bindloadedmetadata(getCustomEvent('loadedmetadata',
      {},
      {
        detail: {
          width: naturalSize.width,
          height: naturalSize.height,
          duration
        },
        layoutRef
      },
      propsRef.current
    ))
  }

  // 处理错误
  function handleError ({ error }) {
    binderror && binderror(getCustomEvent('play', {}, { detail: { error }, layoutRef }, propsRef.current))
  }

  function play () {
    videoRef.current.resume()
  }
  function pause () {
    videoRef.current.pause()
  }
  function seek (position) {
    videoRef.current.seek(position)
  }
  function stop () {
    videoRef.current.pause()
    seek(0)
  }
  function exitFullScreen () {
    videoRef.current.setFullScreen(false)
  }

  function requestFullScreen () {
    videoRef.current.setFullScreen(true)
  }

  const source: ReactVideoSourceProperties = {
    uri: src
  }
  if (isDrm) {
    source.drm = {
      type: DRMType.FAIRPLAY,
      certificateUrl: Platform.OS === 'android' ? provisionUrl : certificateUrl,
      licenseUrl
    }
  }

  const innerProps = useInnerProps(
    props,
    extendObject(
      {
        style: extendObject({}, normalStyle, layoutStyle),
        ref: videoRef,
        source,
        paused: !autoplay,
        repeat: loop,
        muted,
        controls,
        maxBitRate: preferredPeakBitRate,
        fullscreenAutorotate: enableAutoRotation,
        resizeMode: objectFit === 'fill' ? 'stretch' : objectFit,
        poster: controls ? poster : '',
        onProgress: (bindtimeupdate || bindprogress) && handleProgress,
        onEnd: bindended && handleEnd,
        onError: binderror && handleError,
        onBuffer: bindwaiting && handleWaiting,
        onSeek: bindseekcomplete && handleSeekcomplete,
        onPlaybackRateChange:
          (bindpause || bindplay) && handlePlaybackRateChange,
        onFullscreenPlayerDidPresent:
          bindfullscreenchange && handleEnterFullScreen,
        onFullscreenPlayerWillDismiss:
          bindfullscreenchange && handleExitFullScreen,
        onControlsVisibilityChange:
          bindcontrolstoggle && handleAndroidControlsVisibilityChange,
        onLoad: handleVideoLoad
      },
      layoutProps
    ),
    [
      'src',
      'autoplay',
      'loop',
      'bindplay',
      'bindpause',
      'bindended',
      'bindtimeupdate',
      'bindfullscreenchange',
      'bindwaiting',
      'binderror',
      'bindprogress',
      'bindloadedmetadata',
      'bindcontrolstoggle',
      'bindseekcomplete'
    ],
    { layoutRef }
  )
  return createElement(View, { style: { width: normalStyle.width, height: normalStyle.height } },
    createElement(Video, innerProps)
  )
})

export default MpxVideo
