<template>
    <div class="mpx-movable-scroll-content" ref="scrollContent">
        <div class="mpx-movable-scroll-item">
            <slot></slot>
        </div>
    </div>
</template>

<script type="text/ecmascript-6">
  import {getCustomEvent} from './getInnerListeners'
  import BScroll from '@better-scroll/core'
  import Movable from '@better-scroll/movable'
  import Zoom from '@better-scroll/zoom'

  BScroll.use(Movable)
  BScroll.use(Zoom)

  export default {
    data () {
      return {
        directions: ['none', 'all', 'vertical', 'horizontal'],
        minScrollX: 0,
        maxScrollX: 0,
        minScrollY: 0,
        maxScrollY: 0,
        lastestX: 0,
        lastestY: 0,
        lastestScale: 1,
        bsOptions: {},
        isZooming: false,
        isFirstTouch: true,
        source: '',
        touchEvent: ''
      }
    },
    props: {
      direction: {
        type: String,
        default: 'none'
      },
      inertia: {
        type: Boolean,
        default: false
      },
      outOfBounds: {
        type: Boolean,
        default: false
      },
      x: {
        type: Number,
        default: 0
      },
      y: {
        type: Number,
        default: 0
      },
      damping: {
        type: Number,
        default: 20
      },
      friction: {
        type: Number,
        default: 2
      },
      disabled: {
        type: Boolean,
        default: false
      },
      scale: {
        type: Boolean,
        default: false
      },
      scaleMin: {
        type: Number,
        default: 0.5
      },
      scaleMax: {
        type: Number,
        default: 10
      },
      scaleValue: {
        type: Number,
        default: 1
      },
      animation: {
        type: Boolean,
        default: true
      }
    },
    watch: {
      x (newVal) {
        this.source = ''
        if (newVal > this.bs.minScrollX) {
          newVal = this.bs.minScrollX
        }
        if (newVal < this.bs.maxScrollX) {
          newVal = this.bs.maxScrollX
        }
        this.bs.scrollTo(newVal, this.bs.y)
      },
      y (newVal) {
        this.source = ''
        if (newVal > this.bs.minScrollY) {
          newVal = this.bs.minScrollY
        }
        if (newVal < this.bs.maxScrollY) {
          newVal = this.bs.maxScrollY
        }
        this.bs.scrollTo(this.bs.x, newVal)
      },
      scaleValue (newVal) {
        this.isZooming = true
        if (newVal > 10) {
          newVal = 10
        }
        if (newVal < 0.5) {
          newVal = 0.5
        }
        this.bs.zoomTo(newVal, 'center', 'center')
      }
    },
    mounted () {
      this.init()
    },
    beforeDestroy () {
      this.bs && this.bs.destroy()
    },
    methods: {
      init () {
        if (!this.$refs.scrollContent.parentNode || (this.$refs.scrollContent.parentNode && this.$refs.scrollContent.parentNode.className !== 'mpx-movable-scroll-wrapper')) {
          return
        }
        this.initOptions()
        const el = this.$refs.scrollContent
        this.bs = new BScroll(this.$parent.$refs.scroll, {
          specifiedIndexAsContent: [].indexOf.call(el.parentElement.children, el) || 0,
          bindToTarget: true,
          freeScroll: false,
          scrollX: false,
          scrollY: false,
          movable: true,
          startX: this.x,
          startY: this.y,
          bounce: this.outOfBounds || false,
          bounceTime: 800 / (this.damping / 20),
          probeType: 3,
          ...this.bsOptions
        })
        const BehaviorHooks = this.bs.scroller.scrollBehaviorY.hooks
        const actionsHandlerHooks = this.bs.scroller.actionsHandler.hooks
        const scrollerHooks = this.bs.scroller.hooks
        this.bs.putAt(this.x, this.y, 0)
        this.lastestX = this.roundFun(this.x)
        this.lastestY = this.roundFun(this.y)
        this.lastestScale = this.roundFun(this.scaleValue)
        this.minScrollX = this.bs.minScrollX
        this.maxScrollX = this.bs.maxScrollX
        this.minScrollY = this.bs.minScrollY
        this.maxScrollY = this.bs.maxScrollY
        scrollerHooks.on('beforeScrollStart', (position) => {
          this.source = 'touch'
        })
        scrollerHooks.on('scroll', (position) => {
          if (position.x > this.minScrollX && this.bs.movingDirectionX === -1 ||
            (position.x < this.maxScrollX && this.bs.movingDirectionX === 1) ||
            (position.y > this.minScrollY && this.bs.movingDirectionY === -1) ||
            (position.y < this.maxScrollY && this.bs.movingDirectionY === 1)) {
            this.source = 'touch-out-of-bounds'
          }
          if (this.direction !== 'none' && (this.directions.indexOf(this.direction) >= 0)) {
            if (this.isZooming || (this.roundFun(position.x) === this.lastestX && this.roundFun(position.y) === this.lastestY)) {
              return
            }
            this.$emit('change', getCustomEvent('change', {
              x: this.roundFun(position.x) ? this.roundFun(position.x) : 0,
              y: this.roundFun(position.y) ? this.roundFun(position.y) : 0,
              source: this.source
            }))
          }
          this.lastestX = this.roundFun(position.x)
          this.lastestY = this.roundFun(position.y)
        })
        scrollerHooks.on('touchEnd', (position) => {
          this.isFirstTouch = true
          if (position.x > this.minScrollX || position.x < this.maxScrollX ||
            position.y > this.minScrollY || position.y < this.maxScrollY
          ) {
            this.source = 'out-of-bounds'
          }
          if (position.x > this.minScrollX) {
            this.bs.movingDirectionX = 1
          }
          if (position.x < this.maxScrollX) {
            this.bs.movingDirectionX = -1
          }
          if (position.y > this.minScrollY) {
            this.bs.movingDirectionY = 1
          }
          if (position.y < this.maxScrollY) {
            this.bs.movingDirectionY = -1
          }
        })
        actionsHandlerHooks.on('move', ({ deltaX, deltaY, e }) => {
          if (this.isZooming) {
            return
          }
          if (this.isFirstTouch) {
            if (Math.abs(deltaX) -  Math.abs(deltaY) > 0) {
              this.touchEvent = 'htouchmove'
            } else {
              this.touchEvent = 'vtouchmove'
            }
          }
          this.$emit(this.touchEvent)
          this.isFirstTouch = false
        })
        if (this.inertia) { // movable-view是否带有惯性
          BehaviorHooks.on('momentum', (momentumData, distance) => {
            this.source = 'friction'
          })
        }
        if (this.scale) { // 支持双指缩放
          this.bs.on('zooming', ({scale}) => {
            if (this.lastestScale === this.roundFun(scale)) {
              return
            }
            this.isZooming = true
            this.$emit('scale', getCustomEvent('change', {
              x: this.roundFun(this.bs.x),
              y: this.roundFun(this.bs.y),
              scale: this.roundFun(scale)
            }))
            this.lastestScale = this.roundFun(scale)
          })
          this.bs.on('zoomEnd', ({ scale }) => {
            this.isZooming = false
          })
        }
        if (this.disabled) { // 禁用
          this.bs.disable()
        }
      },
      initOptions () {
        if (!this.friction || this.friction < 0) {
          this.bsOptions = {
            ...this.bsOptions,
            friction: 2
          }
        }
        if (this.$parent.$attrs && this.$parent.$attrs['scale-area'] === "true") {
          this.bsOptions = {
            ...this.bsOptions,
            bindToTarget: this.scale ? false : true
          }
        }
        if (this.scale) {
          this.bsOptions = {
            ...this.bsOptions,
            zoom:  { // for zoom plugin
              start: this.scaleValue,
              min: this.scaleMin < 0.5 ? 0.5 : this.scaleMin,
              max: this.scaleMax > 10 ? 10 : this.scaleMax
            }
          }
        }
        if (this.inertia) {
          this.bsOptions = {
            ...this.bsOptions,
            momentum: true,
            momentumLimitDistance: 30,
            deceleration: this.friction / 2 * 0.05,
            swipeTime: 50
          }
        }
        if (this.direction === 'vertical') {
          this.bsOptions = {
            ...this.bsOptions,
            scrollY: true
          }
        }
        if (this.direction === 'horizontal') {
          this.bsOptions = {
            ...this.bsOptions,
            scrollX: true
          }
        }
        if (this.direction === 'all') {
          this.bsOptions = {
            ...this.bsOptions,
            freeScroll: true,
            scrollX: true,
            scrollY: true
          }
        }
      },
      // 处理小数点，四舍五入，默认保留一位小数
      roundFun(value, n = 1) {
        return Math.round(value * Math.pow(10, n)) / Math.pow(10, n)
      }
    }
  }
</script>
<style lang="stylus" rel="stylesheet/stylus" scoped>
    .mpx-movable-scroll-content {
        position: absolute
    }
</style>
