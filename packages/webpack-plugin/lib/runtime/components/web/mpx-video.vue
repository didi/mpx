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
  // import getInnerListeners from './getInnerListeners'
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
        videoNode: null,
        showControlsTool: this.controls,
        mutedCopy: this.muted,
        classList: '',
        processTimer: null
      }
    },
    mounted () {
      this.videoNode = this.$refs['_mpx_video_ref']
      this.initStyle()
      this.initEvent()
      this.fullscreenchangeHandler()
    },
    methods: {
      initStyle () {
        if (this.initialTime) {
          this.videoNode.currentTime = this.initialTime
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
        this.videoNode.addEventListener('play', () => {
          this.$emit('play')
          this.processListener()
        })
        this.videoNode.addEventListener('pause', () => {
          clearInterval(this.processTimer)
          this.$emit('pause')
        })
        this.videoNode.addEventListener('ended', () => {
          this.$emit('ended')
        })
        this.videoNode.addEventListener('error', (e) => {
          this.$emit('error', e)
        })
        this.videoNode.addEventListener('waiting', (e) => {
          this.$emit('waiting', e)
        })
        this.videoNode.addEventListener('loadedmetadata', (e) => {
          this.$emit('loadedmetadata', e)
        })
        this.videoNode.addEventListener('timeupdate', (e) => {
          this.$emit('timeupdate', e)
        })
      },
      processListener () {
        this.processTimer = setInterval(() => {
          const e = {
            currentTime: this.videoNode.currentTime,
            duration: 90
          }
          this.$emit('bindtimeupdate', e)
        }, 250)
      },
      fullscreenchangeHandler () {
        // 监听全屏状态 兼容
        this.videoNode.addEventListener('fullscreenchange', (e) => {
          if (document.isFullScreen) {
            this.$emit('bindfullscreenchange', {fullScreen: true})
          } else {
            this.$emit('bindfullscreenchange', {fullScreen: false})
          }
        })
        this.videoNode.addEventListener('webkitfullscreenchange', (e) => {
          if (document.webkitIsFullScreen) {
            this.$emit('bindfullscreenchange', {fullScreen: true})
          } else {
            this.$emit('bindfullscreenchange', {fullScreen: false})
          }
        })
        this.videoNode.addEventListener('mozfullscreenchange', (e) => {
          if (document.mozIsFullScreen) {
            this.$emit('bindfullscreenchange', {fullScreen: true})
          } else {
            this.$emit('bindfullscreenchange', {fullScreen: false})
          }
        })
        this.videoNode.addEventListener('MSFullscreenChange', (e) => {
          if (document.MSIsFullScreen) {
            this.$emit('bindfullscreenchange', {fullScreen: true})
          } else {
            this.$emit('bindfullscreenchange', {fullScreen: false})
          }
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
