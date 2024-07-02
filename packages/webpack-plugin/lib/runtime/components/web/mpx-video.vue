<template>
  <video
    ref="_mpx_video_ref"
    class="video-js"
    v-bind="playsinlineAttr"
   ></video>
 </template>
 <script>
  import { inheritEvent } from './getInnerListeners'
  import videojs from 'video.js'
  import 'video.js/dist/video-js.min.css'

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
      initialTime: {
        type: Number,
        default: 0
      },
      direction: Number,
      showProgress: { // done
        type: Boolean,
        default: true
      },
      showBottomProgress: { // done
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
    data () {
      return {
      }
    },
    computed: {
    playsinlineAttr () {
      if (!this.playsinline) return {}
      return {
        'webkit-playsinline': true,
        'playsinline': true,
        'x5-playsinline': true,
        'x5-video-orientation': 'landscape|portrait'
      }
    }
  },
    watch: {
      muted: function (val) {
        this._player?.muted(val)
      },
      controls: function (show) {
        this.$emit('controlstoggle', inheritEvent('controlstoggle', {}, { show }))
      }
    },
    mounted () {
      const videoNode = this.$refs['_mpx_video_ref']
      this._player = videojs(videoNode, {
        controls: true,
        sources:[
          {
            src: this.src
          }
        ],
        autoplay: this.autoplay,
        loop: this.loop,
         /**
          log 若 controls 属性值为 false 则设置 poster 无效
        */
        poster: this.controls ? this.poster : ''
      }, function () {
      })
      this.initPlayer()
      this.initStyle()
      this.initEvent()
    },
    methods: {
      initPlayer () {
        this._player.muted(this.muted)
        if (this.initialTime) {
          this._player.currentTime(this.initialTime)
        }
      },
      initStyle () {
        if (!this.controls) this._player.el_.classList.add('mpx-no-show_controls')

        if (!this.showBottomProgress) this._player.el_.classList.add('mpx-no-show_progress')

        /**
          showProgress若不设置，宽度大于240时才会显示
        */
        if (!this.showProgress || (this._player.el_.offsetWidth < 240 && this.showProgress)) this._player.el_.classList.add('mpx-no-show_progress')

        if (!this.showFullscreenBtn) this._player.el_.classList.add('mpx-no-show_fullscreen_btn')

        if (!this.showPlayBtn) this._player.el_.classList.add('mpx-no-show_play_btn')

        if (!this.showCenterPlayBtn) this._player.el_.classList.add('mpx-no-show_center_play_btn')

        if (!this.showMuteBtn) this._player.el_.classList.add('mpx-no-show_mute_btn')
      },
      initEvent () {
        this._player.on('play', (e) => {
          this.$emit('play', inheritEvent('play', e, {}))
        })

        this._player.on('pause', (e) => {
          this.$emit('pause', inheritEvent('pause', e, {}))
        })

        this._player.on('ended', (e) => {
          this.$emit('ended', inheritEvent('ended', e, {}))
        })

        this._player.on('timeupdate', (e) => {
          this.$emit('timeupdate', inheritEvent('timeupdate', e, {}))
        })

        this._player.on('error', (e) => {
          this.$emit('error', inheritEvent('error', e, {}))
        })

        this._player.on('waiting', (e) => {
          this.$emit('waiting', inheritEvent('waiting', e, {}))
        })
        this._player.on('loadedmetadata', (e) => {
          this.$emit('loadedmetadata', inheritEvent('loadedmetadata', e, {}))
        })

        this._player.on('progress', (e) => {
          const eNode = e.target
          const buffered = (eNode?.buffered?.end(0)) / (eNode?.duration)
          this.$emit('progress', inheritEvent('progress', e, { buffered: buffered * 100 }))
        })

        this._player.on('seeked', (e) => {
          const eNode = e.target
          this.$emit('seekcomplete', inheritEvent('seekcomplete', e, { position: eNode.currentTime  }))
        })
        this._player.on('fullscreenchange', (e) => {
          if (!this._player.paused()) {
            // hack: 解决退出全屏自动暂停
            setTimeout(() => {
              this._player.play()
            }, 500)
          }
          this.$emit('fullscreenchange', inheritEvent('fullscreenchange', e, { fullScreen: this._player.isFullscreen() }))
        })

        this._player.on('enterpictureinpicture', (e) => {
          this.$emit('enterpictureinpicture', inheritEvent('enterpictureinpicture', e, {}))
        })

        this._player.on('leavepictureinpicture', (e) => {
          this.$emit('leavepictureinpicture', inheritEvent('leavepictureinpicture', e, {}))
        })

      }
    }
  }
 </script>

 <style lang="stylus">

    .vjs-chapters-button
      display: none !important

   .mpx-no-show_controls
     .vjs-control-bar
       display none !important

   .mpx-no-show_progress
     .vjs-progress-control
       display none !important

   .mpx-no-show_fullscreen_btn
     .vjs-fullscreen-control
       display none !important

   .mpx-no-show_play_btn
     .vjs-play-control
       display none !important

   .mpx-no-show_center_play_btn
     .vjs-big-play-button
       display none !important

   .mpx-no-show_mute_btn
     .vjs-mute-control
       display none !important
 </style>
