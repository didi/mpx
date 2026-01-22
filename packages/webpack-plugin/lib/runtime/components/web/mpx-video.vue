<template>
  <div
   ref="_mpx_video_ref"
  >
  </div>
</template>
<script>
  import { inheritEvent } from './getInnerListeners'
  import miniPlayer from './mini-video-controls.min.js'

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
        const volume = val ? 0 : 0.5
        this._player.volume(volume, true, false)
        this._player.video.muted = val
      },
      controls: function (show) {
        this.$emit('controlstoggle', inheritEvent('controlstoggle', {}, { show }))
      },
      objectFit (val) {
        if (this._player && this._player.video) {
          this._player.video.style.objectFit = val
        }
      }
    },
    mounted () {
      const videoNode = this.$refs['_mpx_video_ref']
      this._player = new miniPlayer({
        container: videoNode,
        autoplay: this.autoplay,
        loop: this.loop,
        hotkey: true,
        airplay: false,
        video: {
          url: this.src,
          pic: this.controls ? this.poster : '' // log 若 controls 属性值为 false 则设置 poster 无效
        }
      })
      this.initPlayer()
      this.initStyle()
      this.initEvent()
    },
    methods: {
      initPlayer () {
        if (this.playsinline) {
          this._player.video.setAttribute('webkit-playsinline', true)
          this._player.video.setAttribute('playsinline', true)
          this._player.video.setAttribute('x5-playsinline', true)
          this._player.video.setAttribute('x5-video-orientation', true)
        }
        if (this.muted) {
          this._player.volume(0, true, false)
          this._player.video.muted = this.muted
        }
        let muted = this.muted
        this._player.template.volumeButtonIcon.addEventListener('click', () => {
          muted = !muted
          const volume = muted ? 0 : 0.5
          this._player.volume(volume, true, false)
          this._player.video.muted = muted
        })
        if (this.initialTime) {
          this._player.seek(this.initialTime)
        }
        if (this.objectFit) {
          this._player.video.style.objectFit = this.objectFit
        }
      },
      initStyle () {

        if (!this.controls) this._player.container.classList.add('mpx-no-show_controls')

        if (!this.showBottomProgress) this._player.container.classList.add('mpx-no-show_progress')

        /**
           showProgress若不设置，宽度大于240时才会显示
        */
        if (!this.showProgress || (this._player.container.offsetWidth < 240 && this.showProgress)) this._player.container.classList.add('mpx-no-show_progress')

        if (!this.showFullscreenBtn) this._player.container.classList.add('mpx-no-show_fullscreen_btn')

        if (!this.showPlayBtn) this._player.container.classList.add('mpx-no-show_play_btn')

        if (!this.showCenterPlayBtn) this._player.container.classList.add('mpx-no-show_center_play_btn')

        if (!this.showMuteBtn) this._player.container.classList.add('mpx-no-show_mute_btn')
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
          let buffered = 0
          if (eNode?.buffered && eNode.buffered.length > 0) {
            buffered = (eNode.buffered.end(0)) / (eNode?.duration)
          }
          this.$emit('progress', inheritEvent('progress', e, { buffered: buffered * 100 }))
        })

        this._player.on('seeked', (e) => {
          const eNode = e.target
          this.$emit('seekcomplete', inheritEvent('seekcomplete', e, { position: eNode.currentTime  }))
        })
        this._player.on('fullscreen', (e = {}) => {
          this.$emit('fullscreenchange', inheritEvent('fullscreenchange', new Event(e), { fullScreen: true }))
        })
        this._player.on('fullscreen_cancel', (e = {}) => {
          this.$emit('fullscreenchange', inheritEvent('fullscreenchange', new Event(e), { fullScreen: false }))
        })

        // this._player.on('enterpictureinpicture', (e) => {
        //   this.$emit('enterpictureinpicture', inheritEvent('enterpictureinpicture', e, {}))
        // })

        // this._player.on('leavepictureinpicture', (e) => {
        //   this.$emit('leavepictureinpicture', inheritEvent('leavepictureinpicture', e, {}))
        // })

      }
    }
  }
</script>

<style lang="stylus">

 .vjs-chapters-button,.dplayer-full-in-icon,.dplayer-setting
   display: none !important

 .mpx-no-show_controls
   .dplayer-controller
     display none !important
   .dplayer-controller-mask
     display none !important
   .dplayer-mobile-play
     display none !important

 .mpx-no-show_progress
   .dplayer-bar-wrap
     display none !important

 .mpx-no-show_fullscreen_btn
   .dplayer-full-icon
     visibility hidden !important

 .mpx-no-show_play_btn
   .dplayer-play-icon
     display none !important

 .mpx-no-show_center_play_btn
   .dplayer-mobile-play
     display none !important

 .mpx-no-show_mute_btn
   .dplayer-volume-icon
     display none !important
</style>
