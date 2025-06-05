<template>
  <div class="mpx-movable-scroll-content" ref="scrollContent">
    <div class="mpx-movable-scroll-item">
      <slot></slot>
    </div>
  </div>
</template>

<script type="text/ecmascript-6">
import { getCustomEvent, extendEvent } from './getInnerListeners'
import { extend } from '../../utils'
import BScroll from '@better-scroll/core'
import Movable from '@better-scroll/movable'
import ObserveDOM from '@better-scroll/observe-dom'
import Zoom from '@better-scroll/zoom'

BScroll.use(Movable)
BScroll.use(Zoom)
BScroll.use(ObserveDOM)

export default {
  data () {
    return {
      directions: ['none', 'all', 'vertical', 'horizontal'],
      minScrollX: 0,
      maxScrollX: 0,
      minScrollY: 0,
      maxScrollY: 0,
      currentX: this.x,
      currentY: this.y,
      lastestX: 0,
      lastestY: 0,
      lastestScale: 1,
      bsOptions: {},
      isZooming: false,
      isFirstTouch: true,
      source: '',
      touchEvent: '',
      isInited: false,
      deactivatedX: 0,
      deactivatedY: 0
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
    },
    speed: {
      type: Number,
      default: 500
    },
    scrollOptions: {
      type: Object,
      default: () => {
        return {}
      }
    },
  },
  watch: {
    x (newVal) {
      if (this.direction === 'vertical' || this.direction === 'none') {
        return
      }
      this.source = ''
      const currentX = this.bs.x
      // 兼容容器尺寸变化且同时改变x的场景，ResizeObserver回调是异步的，如果不直接refresh，minScrollX, maxScrollX 拿到的都是上一次的值
      this.refresh()
      // bs refresh 方法内会触发 resetPosition()，如果容器宽度从 100 - 50，y 从 100 - 50，这会导致位置立即跳转到边界内，没有动画效果，造成视觉突兀
      // 如果 refresh 导致了位置变化，先恢复到原位置再动画滚动
      if (this.bs.x !== currentX) {
        this.bs.scrollTo(currentX, this.bs.y, 0)
      }
      if (newVal > this.bs.minScrollX) {
        newVal = this.bs.minScrollX
      }
      if (newVal < this.bs.maxScrollX) {
        newVal = this.bs.maxScrollX
      }
      this.currentX = newVal
      this.bs.scrollTo(newVal, this.bs.y, this.speed)
    },
    y (newVal) {
      if (this.direction === 'horizontal' || this.direction === 'none') {
        return
      }
      this.source = ''
      // 兼容容器尺寸变化且同时改变y的场景，ResizeObserver回调是异步的，如果不直接refresh，minScrollY, maxScrollY 拿到的都是上一次的值
      const currentY = this.bs.y
      this.refresh()
      // bs refresh 方法内会触发 resetPosition()，如果容器高度从 100 - 50，y 从 100 - 50，这会导致位置立即跳转到边界内，没有动画效果，造成视觉突兀
      // 如果 refresh 导致了位置变化，先恢复到原位置再动画滚动
      if (this.bs.y !== currentY) {
        this.bs.scrollTo(this.bs.x, currentY, 0)
      }
      if (newVal > this.bs.minScrollY) {
        newVal = this.bs.minScrollY
      }
      if (newVal < this.bs.maxScrollY) {
        newVal = this.bs.maxScrollY
      }
      this.currentY = newVal
      this.bs.scrollTo(this.bs.x, newVal, this.speed)
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
    },
    disabled () {
      this.init()
    }
  },
  mounted () {
    if (!this.scrollOptions.closeResizeObserver) {
      this.createResizeObserver()
    }
    this.init()
  },
  activated () {
    if (this.deactivatedX || this.deactivatedY) {
      this.refresh()
      this.bs.putAt(this.deactivatedX, this.deactivatedY, 0)
    }
  },
  deactivated () {
    // when the hook is triggered
    // bs will recalculate the boundary of movable to 0
    // so record the position of the movable
    this.deactivatedX = this.bs.x
    this.deactivatedY = this.bs.y
  },
  beforeDestroy () {
    this.destroyBs()
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  },
  methods: {
    createResizeObserver () {
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(entries => {
          if (!this.isInited) {
            this.isInited = true
            return
          }
          this.refresh()
        })
        const elementToObserve = document.querySelector('.mpx-movable-scroll-content')
        elementToObserve && this.resizeObserver.observe(elementToObserve)
      }
    },
    refresh () {
      this.bs && this.bs.refresh()
    },
    destroyBs () {
      if (!this.bs) return
      this.bs.destroy()
      delete this.bs
    },
    init () {
      this.destroyBs()
      if (!this.$refs.scrollContent.parentNode || (this.$refs.scrollContent.parentNode && this.$refs.scrollContent.parentNode.className !== 'mpx-movable-scroll-wrapper')) {
        return
      }
      this.initOptions()
      const el = this.$refs.scrollContent
      this.bs = new BScroll(this.$parent.$refs.scroll, extend({
        specifiedIndexAsContent: [].indexOf.call(el.parentElement.children, el) || 0,
        bindToTarget: true,
        freeScroll: false,
        scrollX: false,
        scrollY: false,
        movable: true,
        startX: this.currentX,
        startY: this.currentY,
        bounce: this.outOfBounds,
        bounceTime: 800 / (this.damping / 20),
        probeType: 3
      }, this.bsOptions))
      const BehaviorHooks = this.bs.scroller.scrollBehaviorY.hooks
      const actionsHandlerHooks = this.bs.scroller.actionsHandler.hooks
      const scrollerHooks = this.bs.scroller.hooks
      this.bs.putAt(this.currentX, this.currentY, 0)
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
          }, this))
        }
        this.lastestX = this.roundFun(position.x)
        this.lastestY = this.roundFun(position.y)
      })
      scrollerHooks.on('scrollEnd', (position) => {
        this.currentX = this.bs.x
        this.currentY = this.bs.y
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
      actionsHandlerHooks.on('start', (e) => {
        extendEvent(e, { detail: Object.assign({}, e.detail) })
        this.$emit('touchstart', e)
      })
      actionsHandlerHooks.on('end', (e) => {
        extendEvent(e, { detail: Object.assign({}, e.detail) })
        this.$emit('touchend', e)
      })
      actionsHandlerHooks.on('move', ({ deltaX, deltaY, e }) => {
        if (this.isZooming) {
          return
        }
        if (this.isFirstTouch) {
          if (Math.abs(deltaX) - Math.abs(deltaY) > 0) {
            this.touchEvent = 'htouchmove'
          } else {
            this.touchEvent = 'vtouchmove'
          }
        }
        extendEvent(e, { detail: Object.assign({}, e.detail), currentTarget: e.target })
        this.$emit(this.touchEvent, e)
        this.$emit('touchmove', e)
        this.isFirstTouch = false
      })
      if (this.inertia) { // movable-view是否带有惯性
        BehaviorHooks.on('momentum', (momentumData, distance) => {
          this.source = 'friction'
        })
      }
      if (this.scale) { // 支持双指缩放
        this.bs.on('zooming', ({ scale }) => {
          if (this.lastestScale === this.roundFun(scale)) {
            return
          }
          this.isZooming = true
          this.$emit('scale', getCustomEvent('change', {
            x: this.roundFun(this.bs.x),
            y: this.roundFun(this.bs.y),
            scale: this.roundFun(scale)
          }, this))
          this.lastestScale = this.roundFun(scale)
        })
        this.bs.on('zoomEnd', ({ scale }) => {
          this.isZooming = false
        })
      }
    },
    initOptions () {
      if (!this.friction || this.friction < 0) {
        this.friction = 2
      }
      if (this.$parent.$attrs && this.$parent.$attrs['scale-area'] === "true") {
        extend(this.bsOptions, {
          bindToTarget: !this.scale
        })
      }
      if (this.scale) {
        extend(this.bsOptions, {
          zoom: { // for zoom plugin
            start: this.scaleValue,
            min: this.scaleMin < 0.5 ? 0.5 : this.scaleMin,
            max: this.scaleMax > 10 ? 10 : this.scaleMax
          }
        })
      }
      if (this.inertia) {
        extend(this.bsOptions, {
          momentum: true,
          momentumLimitDistance: 30,
          deceleration: this.friction / 2 * 0.05,
          swipeTime: 50
        })
      }
      if (this.disabled) {
        extend(this.bsOptions, {
          freeScroll: false,
          scrollY: false,
          scrollX: false
        })
      } else if (this.direction === 'vertical') {
        extend(this.bsOptions, {
          scrollY: true
        })
      } else if (this.direction === 'horizontal') {
        extend(this.bsOptions, {
          scrollX: true
        })
      } else if (this.direction === 'all') {
        extend(this.bsOptions, {
          freeScroll: true,
          scrollX: true,
          scrollY: true
        })
      }
      extend(this.bsOptions, this.scrollOptions)
    },
    // 处理小数点，四舍五入，默认保留一位小数
    roundFun (value, n = 1) {
      return Math.round(value * Math.pow(10, n)) / Math.pow(10, n)
    }
  }
}
</script>
<style lang="stylus" rel="stylesheet/stylus" scoped>
  .mpx-movable-scroll-content
    position: absolute
    .mpx-movable-scroll-item
      width: 100%
      height: 100%
</style>
