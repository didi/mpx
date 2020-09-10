<script>
  import getInnerListeners, { getCustomEvent } from './getInnerListeners'
  import { processSize } from './util'
  import BScroll from '@better-scroll/core'
  import ObserveDom from '@better-scroll/observe-dom'
  import throttle from 'lodash/throttle'

  BScroll.use(ObserveDom)

  export default {
    name: 'mpx-scroll-view',
    props: {
      scrollX: Boolean,
      scrollY: Boolean,
      upperThreshold: {
        type: [Number, String],
        default: 50
      },
      lowerThreshold: {
        type: [Number, String],
        default: 50
      },
      scrollTop: {
        type: [Number, String],
        default: 0
      },
      scrollLeft: {
        type: [Number, String],
        default: 0
      },
      observeDOM: Boolean,
      scrollIntoView: String,
      scrollWithAnimation: Boolean,
      enableFlex: Boolean
    },
    computed: {
      _scrollTop () {
        return processSize(this.scrollTop)
      },
      _scrollLeft () {
        return processSize(this.scrollLeft)
      }
    },
    mounted () {
      this.bs = new BScroll(this.$refs.wrapper, {
        startX: -this._scrollLeft,
        startY: -this._scrollTop,
        scrollX: this.scrollX,
        scrollY: this.scrollY,
        probeType: 3,
        bounce: false,
        observeDOM: this.observeDOM
      })
      this.lastX = -this._scrollLeft
      this.lastY = -this._scrollTop
      this.bs.on('scroll', throttle(({ x, y }) => {
        const deltaX = x - this.lastX
        const deltaY = y - this.lastY
        this.$emit('scroll', getCustomEvent('scroll', {
          scrollLeft: -x,
          scrollTop: -y,
          scrollWidth: this.bs.scrollerWidth,
          scrollHeight: this.bs.scrollerHeight,
          deltaX,
          deltaY
        }))
        if (this.bs.minScrollX - x < this.upperThreshold && deltaX > 0) {
          this.dispatchScrollTo('left')
        }
        if (this.bs.minScrollY - y < this.upperThreshold && deltaY > 0) {
          this.dispatchScrollTo('top')
        }
        if (x - this.bs.maxScrollX < this.lowerThreshold && deltaX < 0) {
          this.dispatchScrollTo('right')
        }
        if (y - this.bs.maxScrollY < this.lowerThreshold && deltaY < 0) {
          this.dispatchScrollTo('bottom')
        }
        this.lastX = x
        this.lastY = y
      }, 30, {
        leading: true,
        trailing: false
      }))
      if (this.scrollIntoView) {
        this.bs.scrollToElement('#' + this.scrollIntoView)
      }
    },
    beforeDestroy () {
      this.bs && this.bs.destroy()
      delete this.bs
    },
    updated () {
      this.refresh()
    },
    watch: {
      scrollIntoView (val) {
        this.bs && this.bs.scrollToElement('#' + val, this.scrollWithAnimation ? 200 : 0)
      },
      _scrollTop (val) {
        this.bs && this.bs.scrollTo(this.bs.x, -val, this.scrollWithAnimation ? 200 : 0)
      },
      _scrollLeft (val) {
        this.bs && this.bs.scrollTo(-val, this.bs.y, this.scrollWithAnimation ? 200 : 0)
      }
    },
    methods: {
      refresh () {
        this.bs && this.bs.refresh()
      },
      dispatchScrollTo: throttle(function (direction) {
        let eventName = 'scrolltoupper'
        if (direction === 'bottom' || direction === 'right') eventName = 'scrolltolower'
        this.$emit(eventName, getCustomEvent(eventName, { direction }))
      }, 200, {
        leading: true,
        trailing: false
      })
    },
    render (createElement) {
      const data = {
        class: 'mpx-scroll-view',
        on: getInnerListeners(this, { ignoredListeners: ['scroll', 'scrolltoupper', 'scrolltolower'] }),
        ref: 'wrapper'
      }
      const content = createElement('div', {
        class: 'mpx-scroll-view-content'
      }, this.$slots.default)
      return createElement('div', data, [content])
    }
  }
</script>

<style lang="stylus">
  .mpx-scroll-view
    overflow hidden
    position relative

    .mpx-scroll-view-content
      position absolute
      top 0
      left 0
</style>
