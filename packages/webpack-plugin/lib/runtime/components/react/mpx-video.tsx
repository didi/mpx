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
  bindplay?: () => void;
  bindpause?: () => void;
  bindended?: () => void;
  bindtimeupdate?: () => void;
  bindfullscreenchange?: () => void;
  bindwaiting?: () => void;
  binderror?: () => void;
  bindprogress?: () => void;
  bindloadedmetadata?: () => void;
  bindcontrolstoggle?: () => void;
  bindseekcomplete?: () => void;
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

  // 处理播放进度更新
  function handleProgress ({ currentTime }) {
    bindtimeupdate?.({ detail: { currentTime } })
    bindprogress?.({ detail: { currentTime } })
  }

  // 处理播放结束
  function handleEnd () {
    bindended()
  }

  // 处理等待
  function handleWaiting () {
    bindwaiting()
  }

  // 数据加载完成
  function handleLoadedmetadata (data) {
    // todo
    bindloadedmetadata()
  }

  function exitFullScreen () {
    videoRef.current.setFullScreen(false)
  }

  function requestFullScreen () {
    videoRef.current.setFullScreen(true)
  }

  // 处理seek完成
  function handleSeekcomplete () {
    bindseekcomplete()
  }

  function handleEnterFullScreen () {
    bindfullscreenchange({ detail: { fullScreen: 1, direction: 'xxx' } })
  }

  function handleExitFullScreen () {
    bindfullscreenchange({ detail: { fullScreen: 0, direction: 'xxx' } })
  }
  function handlePlaybackRateChange (data) {
    if (data.playbackRate === 0) {
      bindpause()
    } else {
      bindplay()
    }
  }

  function handleAndroidControlsVisibilityChange (data) {
    bindcontrolstoggle({ detail: { hidden: !data.isVisible } })
  }

  function handleVideoLoad () {
    if (autoplay) {
      videoRef.current.seek(initialTime)
    }
  }

  // 处理错误
  function handleError (error) {
    binderror({ detail: error })
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
        onTimedMetadata: bindloadedmetadata && handleLoadedmetadata,
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
