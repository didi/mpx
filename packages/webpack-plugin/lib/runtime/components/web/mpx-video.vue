<template>
  <video
    ref="_mpx_video_ref"
    :class="classList"
    webkit-playsinline="true" playsinline="true" x5-playsinline="true"
    :src="src"
    :controls="showControlsTool"
    :autoplay="autoplay"
    :loop="loop"
    :muted="mutedCopy"
    :poster="poster"
  >
  </video>
</template>

<script>
  import { inheritEvent, extendEvent } from './getInnerListeners'
  export default {
    name: 'mpx-video',
    props: {
      src: { // done
        type: String,
        default: ''
      },
      duration: Number,
      controls: { // done
        type: Boolean,
        default: true
      },
      danmuList: {
        type: Array,
        default: () => {
          return []
        }
      },
      danmuBtn: {
        type: Boolean,
        default: false
      },
      enableDanmu: {
        type: Boolean,
        default: false
      },
      autoplay: { // done
        type: Boolean,
        default: false
      },
      loop: { // done
        type: Boolean,
        default: false
      },
      muted: { // done
        type: Boolean,
        default: false
      },
      initialTime: { // done
        type: Number,
        default: 0
      },
      direction: Number,
      showProgress: { // done
        type: Boolean,
        default: true
      },
      showFullscreenBtn: { // done
        type: Boolean,
        default: true
      },
      showPlayBtn: { // done
        type: Boolean,
        default: true
      },
      showCenterPlayBtn: { // done
        type: Boolean,
        default: true
      },
      enableProgressGesture: {
        type: Boolean,
        default: true
      },
      objectFit: {
        type: String,
        default: 'contain'
      },
      poster: String, // done
      showMuteBtn: { // done
        type: Boolean,
        default: false
      },
      title: String,
      playBtnPosition: {
        type: String,
        default: 'bottom'
      },
      enablePlayGesture: {
        type: Boolean,
        default: false
      },
      vslideGesture: {
        type: Boolean,
        default: true
      },
      vslideGestureInFullscreen: {
        type: Boolean,
        default: true
      },
      adUnitId: String,
      posterForCrawle: String,
      showCastingButton: {
        type: Boolean,
        default: false
      },
      pictureInPictureMode: {},
      pictureInPictureShowProgress: {
        type: Boolean,
        default: false
      },
      enableAutoRotation: {
        type: Boolean,
        default: false
      },
      showScreenLockButton: {
        type: Boolean,
        default: false
      }
    },
    data () {
      return {
        showControlsTool: this.controls,
        mutedCopy: this.muted,
        classList: ''
      }
    },
    mounted () {
      this.initStyle()
      this.initEvent()
    },
    methods: {
      initStyle () {
        const videoNode = this.$refs['_mpx_video_ref']
        if (this.initialTime) {
          videoNode.currentTime = this.initialTime
        }
        if (this.autoplay) { // log 解决autoplay无法自动播放问题
          this.mutedCopy = true
        }
        if (!this.showProgress) this.classList += ' mpx-no-show_progress'
        if (!this.showFullscreenBtn) this.classList += ' mpx-no-show_fullscreen_btn'
        if (!this.showPlayBtn) this.classList += ' mpx-no-show_play_btn'
        if (!this.showCenterPlayBtn) this.classList += ' mpx-no-show_center_play_btn'
        if (!this.showMuteBtn) this.classList += ' mpx-no-show_mute_btn'
      },
      initEvent () {
        const videoNode = this.$refs['_mpx_video_ref']

        videoNode.addEventListener('play', (e) => {
          extendEvent(e, {detail: {}})
          this.$emit('play', e)
        })

        videoNode.addEventListener('pause', (e) => {
          extendEvent(e, {detail: {}})
          this.$emit('pause', e)
        })

        videoNode.addEventListener('ended', (e) => {
          extendEvent(e, {detail: {}})
          this.$emit('ended', e)
        })

        videoNode.addEventListener('timeupdate', (e) => {
          const eNode = e.target
          extendEvent(e, {detail: {currentTime: eNode.currentTime, duration: eNode.duration}})
          this.$emit('timeupdate', e)
        })

        videoNode.addEventListener('error', (e) => {
          extendEvent(e, {detail: {}})
          this.$emit('error', e)
        })

        videoNode.addEventListener('waiting', (e) => {
          extendEvent(e, {detail: {}})
          this.$emit('waiting', e)
        })

        videoNode.addEventListener('loadedmetadata', (e) => {
          const eNode = e.target
          extendEvent(e, {detail: {width: eNode.videoWidth, height: eNode.videoHeight, duration: eNode.duration}})
          this.$emit('loadedmetadata', e)
        })

        videoNode.addEventListener('progress', (e) => {
          const eNode = e.target
          const buffered = (eNode?.buffered?.end(0)) / (eNode?.duration)
          extendEvent(e, {detail: {buffered: buffered * 100}})
          this.$emit('progress', e)
        })

        videoNode.addEventListener('seeked', (e) => {
          const eNode = e.target
          const NewEvent = inheritEvent('seekcomplete', e, {position: eNode.currentTime})
          this.$emit('seekcomplete', NewEvent)
        })

        videoNode.addEventListener('fullscreenchange', (e) => {
          const eNode = e.target
          //  TODO direction
          extendEvent(e, {detail: {fullScreen: false}})
          if (document.isFullScreen) {
            e.detail.fullScreen = true
            this.$emit('fullscreenchange', e)
          } else {
            e.detail.fullScreen = false
            this.$emit('fullscreenchange', e)
          }
        })

        videoNode.addEventListener('enterpictureinpicture', (e) => {
          extendEvent(e, {detail: {}})
          this.$emit('enterpictureinpicture', e)
        })

        videoNode.addEventListener('leavepictureinpicture', (e) => {
          extendEvent(e, {detail: {}})
          this.$emit('leavepictureinpicture', e)
        })
      }
    }
  }
</script>

<style lang="stylus">
  .mpx-video-container
    .mpx-no-show_progress
      &::-webkit-media-controls-timeline
        display none !important
    .mpx-no-show_fullscreen_btn
      &::-webkit-media-controls-fullscreen-button
        display none !important
    .mpx-no-show_play_btn
      &::-webkit-media-controls-play-button
        display none !important
    .mpx-no-show_center_play_btn
      &::-webkit-media-controls-start-playback-button
        display none !important
    .mpx-no-show_mute_btn
      &::-webkit-media-controls-mute-button
        display none !important
</style>
