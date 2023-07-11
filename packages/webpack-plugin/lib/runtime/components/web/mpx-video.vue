<template>
  <video
    ref="_mpx_video_ref"
    :class="classList"
    :src="src"
    :controls="showControlsTool"
    :autoplay="autoplay"
    :loop="loop"
    :muted="mutedCopy"
    :poster="poster"
    v-bind="playsinlineAttr"
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
      },
      playsinline: {
        type: Boolean,
        default: true
      }
    },
    computed: {
      playsinlineAttr () {
        if (!this.playsinline) return {}
        return {
          'webkit-playsinline': true,
          'playsinline': true,
          'x5-playsinline': true
        }
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
          this.$emit('play', inheritEvent('play', e, {}))
        })

        videoNode.addEventListener('pause', (e) => {
          this.$emit('pause', inheritEvent('pause', e, {}))
        })

        videoNode.addEventListener('ended', (e) => {
          this.$emit('ended', inheritEvent('ended', e, {}))
        })

        videoNode.addEventListener('timeupdate', (e) => {
          const eNode = e.target
          this.$emit('timeupdate', inheritEvent('timeupdate', e, { currentTime: eNode.currentTime, duration: eNode.duration }))
        })

        videoNode.addEventListener('error', (e) => {
          this.$emit('error', inheritEvent('error', e, {}))
        })

        videoNode.addEventListener('waiting', (e) => {
          this.$emit('waiting', inheritEvent('waiting', e, {}))
        })

        videoNode.addEventListener('loadedmetadata', (e) => {
          const eNode = e.target
          this.$emit('loadedmetadata', inheritEvent('loadedmetadata', e, { width: eNode.videoWidth, height: eNode.videoHeight, duration: eNode.duration }))
        })

        videoNode.addEventListener('progress', (e) => {
          const eNode = e.target
          const buffered = (eNode?.buffered?.end(0)) / (eNode?.duration)
          this.$emit('progress', inheritEvent('progress', e, { buffered: buffered * 100 }))
        })

        videoNode.addEventListener('seeked', (e) => {
          const eNode = e.target
          this.$emit('seekcomplete', inheritEvent('seekcomplete', e, { position: eNode.currentTime }))
        })

        videoNode.addEventListener('fullscreenchange', (e) => {
          //  TODO direction
          if (document.isFullScreen) {
            this.$emit('fullscreenchange', inheritEvent('fullscreenchange', e, { fullScreen: true }))
          } else {
            this.$emit('fullscreenchange', inheritEvent('fullscreenchange', e, { fullScreen: false }))
          }
        })

        videoNode.addEventListener('enterpictureinpicture', (e) => {
          this.$emit('enterpictureinpicture', inheritEvent('enterpictureinpicture', e, {}))
        })

        videoNode.addEventListener('leavepictureinpicture', (e) => {
          this.$emit('leavepictureinpicture', inheritEvent('leavepictureinpicture', e, {}))
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
