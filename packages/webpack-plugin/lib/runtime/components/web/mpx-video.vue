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
  import { inheritEvent } from './getInnerListeners'
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
          const eventDetails = e && inheritEvent('play', e, {})
          this.$emit('play', eventDetails)
        })

        videoNode.addEventListener('pause', (e) => {
          const eventDetails = e && inheritEvent('pause', e, {})
          this.$emit('pause', eventDetails)
        })

        videoNode.addEventListener('ended', (e) => {
          const eventDetails = e && inheritEvent('ended', e, {})
          this.$emit('ended', eventDetails)
        })

        videoNode.addEventListener('timeupdate', (e) => {
          const eNode = e.target || {}
          const eventDetails = e && inheritEvent('timeupdate', e, { currentTime: eNode.currentTime, duration: eNode.duration })
          this.$emit('timeupdate', eventDetails)
        })

        videoNode.addEventListener('error', (e) => {
          const eventDetails = e && inheritEvent('error', e, {})
          this.$emit('error', eventDetails)
        })

        videoNode.addEventListener('waiting', (e) => {
          const eventDetails = e && inheritEvent('waiting', e, {})
          this.$emit('waiting', eventDetails)
        })

        videoNode.addEventListener('loadedmetadata', (e) => {
          const eNode = e.target || {}
          const eventDetails = e && inheritEvent('loadedmetadata', e, { width: eNode.videoWidth, height: eNode.videoHeight, duration: eNode.duration })
          this.$emit('loadedmetadata', eventDetails)
        })

        videoNode.addEventListener('progress', (e) => {
          const eNode = e.target || {}
          const buffered = (eNode.buffered?.end(0)) / (eNode?.duration)
          const eventDetails = e && inheritEvent('progress', e, { buffered: buffered * 100 })
          this.$emit('progress', eventDetails)
        })

        videoNode.addEventListener('seeked', (e) => {
          const eNode = e.target || {}
          const eventDetails = e && inheritEvent('seekcomplete', e, { position: eNode.currentTime })
          this.$emit('seekcomplete', eventDetails)
        })

        videoNode.addEventListener('fullscreenchange', (e) => {
          const eNode = e.target || {}
          //  TODO direction
          const eventDetails = e && inheritEvent('fullscreenchange', e, { fullScreen: false })
          if (document.isFullScreen) {
            eventDetails.detail.fullScreen = true
            this.$emit('fullscreenchange', eventDetails)
          } else {
            eventDetails.detail.fullScreen = false
            this.$emit('fullscreenchange', eventDetails)
          }
        })

        videoNode.addEventListener('enterpictureinpicture', (e) => {
          const eventDetails = e && inheritEvent('enterpictureinpicture', e, {})
          this.$emit('enterpictureinpicture', eventDetails)
        })

        videoNode.addEventListener('leavepictureinpicture', (e) => {
          const eventDetails = e && inheritEvent('leavepictureinpicture', e, {})
          this.$emit('leavepictureinpicture', eventDetails)
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
