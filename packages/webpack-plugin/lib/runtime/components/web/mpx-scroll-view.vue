<script>
  import getInnerListeners from '@mpxjs/webpack-plugin/lib/runtime/components/web/getInnerListeners'
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
        type: Number,
        default: 0
      },
      scrollLeft: {
        type: Number,
        default: 0
      },
      autoRefresh: {
        type: Boolean,
        default: true
      },
      scrollIntoView: String,
      scrollWithAnimation: Boolean,
      enableFlex: Boolean
    },
    mounted () {
      this.bs = new BScroll(this.$refs.wrapper, {
        startX: -this.scrollLeft,
        startY: -this.scrollTop,
        scrollX: this.scrollX,
        scrollY: this.scrollY,
        probeType: 3,
        bounce: {
          top: false,
          bottom: false,
          left: false,
          right: false
        },
        observeDom: this.autoRefresh
      })
      this.lastX = -this.scrollLeft
      this.lastY = -this.scrollTop
      this.bs.on('scroll', throttle(({ x, y }) => {
        const deltaX = x - this.lastX
        const deltaY = y - this.lastY
        this.$emit('scroll', {
          type: 'scroll',
          detail: {
            scrollLeft: -x,
            scrollTop: -y,
            scrollWidth: this.bs.scrollerWidth,
            scrollHeight: this.bs.scrollerHeight,
            deltaX,
            deltaY
          },
          timeStamp: +new Date()
        })
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
    },
    watch: {
      scrollIntoView (val) {
        this.bs && this.bs.scrollToElement('#' + val, this.scrollWithAnimation ? 200 : 0)
      },
      scrollTop (val) {
        this.bs && this.bs.scrollTo(this.bs.x, -val, this.scrollWithAnimation ? 200 : 0)
      },
      scrollLeft (val) {
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
        this.$emit(eventName, {
          type: eventName,
          detail: {
            direction
          },
          timeStamp: +new Date()
        })
      }, 200, {
        leading: true,
        trailing: false
      })
    },
    render (createElement) {
      const data = {
        class: 'mpx-scroll-view',
        on: getInnerListeners(this),
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
