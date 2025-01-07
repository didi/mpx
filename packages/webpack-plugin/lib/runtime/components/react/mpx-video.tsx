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
 * ✔ show-progress
 * ✔ show-fullscreen-btn
 * ✔ show-play-btn
 * ✔ show-center-play-btn
 * ✘ enable-progress-gesture
 * ✔ object-fit
 * ✔ poster
 * ✔ show-mute-btn
 * ✘ title
 * ✔ play-btn-position
 * ✔ enable-play-gesture
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
 * ✔ enable-auto-rotation
 * ✘ show-screen-lock-button
 * ✘ show-snapshot-button
 * ✔ show-background-playback-button
 * ✘ background-poster
 * ✘ referrer-policy
 * ✔ is-drm
 * ✘ is-live
 * ✘ provision-url
 * ✔ certificate-url
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

import { JSX, ReactNode, RefObject, useRef, useState, useEffect, forwardRef, useContext, createElement } from 'react'
import Video from 'react-native-video'
import { StyleSheet, View } from 'react-native'
import { splitProps, splitStyle, useTransformStyle, useLayout, wrapChildren, extendObject, flatGesture, GestureHandler } from './utils'
import useInnerProps, { getCustomEvent } from './getInnerListeners'
import useNodesRef, { HandlerRef } from './useNodesRef'

const styles = StyleSheet.create({
  container: {
    width: 300,
    height: 225
  },
  video: {
    flex: 1
  }
})

const MpxVideo = forwardRef<HandlerRef<ScrollView & View, ScrollViewProps>, ScrollViewProps>((scrollViewProps: ScrollViewProps = {}, ref): JSX.Element => {
  const { innerProps: props = {} } = splitProps(scrollViewProps)
  const {
    src,
    autoplay = false,
    loop = false,
    muted = false,
    initialTime = 0,
    controls = true,
    poster = '',
    onPlay,
    onPause,
    bindprogress,
    bindended,
    binderror,
    style,
    'enable-var': enableVar,
    'external-var-context': externalVarContext,
    'parent-font-size': parentFontSize,
    'parent-width': parentWidth,
    'parent-height': parentHeight
  } = props

  const videoRef = useRef(null)

  const {
    normalStyle,
    hasSelfPercent,
    setWidth,
    setHeight
  } = useTransformStyle(style, { enableVar, externalVarContext, parentFontSize, parentWidth, parentHeight })

  const { layoutRef, layoutStyle, layoutProps } = useLayout({ props, hasSelfPercent, setWidth, setHeight, nodeRef: videoRef })
  const { textStyle, innerStyle = {} } = splitStyle(normalStyle)
  useNodesRef(props, ref, videoRef, {
    style: normalStyle,
    node: {
      play: play
    }
  })

  const [currentTime, setCurrentTime] = useState(0)

  // 处理播放进度更新
  function handleProgress ({ currentTime }) {
    setCurrentTime(currentTime)
    bindprogress?.({ detail: { currentTime } })
  }

  // 处理播放结束
  function handleEnd () {
    bindended?.()
  }

  // 处理错误
  function handleError (error) {
    binderror?.({ detail: error })
  }

  function play () {
    videoRef.current?.resume()
  }
  function pause () {
    videoRef.current?.pause()
  }
  function seek (position) {
    videoRef.current?.seek(position)
  }
  function stop () {
    videoRef.current?.pause()
    videoRef.current?.seek(0)
  }

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri: src }}
        style={styles.video}
        paused={!autoplay}
        repeat={loop}
        muted={muted}
        controls={controls}
        poster={controls ? poster : ''}
        onProgress={handleProgress}
        onEnd={handleEnd}
        onError={handleError}
        // 设置初始播放时间
        seekTime={initialTime}
        // 播放状态改变时的回调
        onPlaybackStatusUpdate={(status) => {
          if (status.isPlaying) {
            onPlay?.()
          } else {
            onPause?.()
          }
        }}
      />
    </View>
  )
})

export default MpxVideo
