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
      scrollOptions: Object,
      updateRefresh: Boolean,
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
      },
      _lowerThreshold () {
        return processSize(this.lowerThreshold)
      },
      _upperThreshold () {
        return processSize(this.upperThreshold)
      }
    },
    mounted () {
      this.init()
    },
    activated () {
      this.refresh()
    },
    beforeDestroy () {
      this.destroy()
    },
    updated () {
      if (this.updateRefresh) this.refresh()
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
      destroy () {
        if (!this.bs) return
        this.bs.destroy()
        delete this.bs
      },
      init () {
        if (this.bs) return
        this.initLayerComputed()
        const originBsOptions = {
          startX: -this._scrollLeft,
          startY: -this._scrollTop,
          scrollX: this.scrollX,
          scrollY: this.scrollY,
          probeType: 3,
          bounce: false
        }
        const bsOptions = Object.assign({}, originBsOptions, this.scrollOptions)
        this.bs = new BScroll(this.$refs.wrapper, bsOptions)
        this.bs.scroller.hooks.on('beforeRefresh', () => {
          this.initLayerComputed()
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
          if (this.bs.minScrollX - x < this._upperThreshold && deltaX > 0) {
            this.dispatchScrollTo('left')
          }
          if (this.bs.minScrollY - y < this._upperThreshold && deltaY > 0) {
            this.dispatchScrollTo('top')
          }
          if (x - this.bs.maxScrollX < this._lowerThreshold && deltaX < 0) {
            this.dispatchScrollTo('right')
          }
          if (y - this.bs.maxScrollY < this._lowerThreshold && deltaY < 0) {
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
      initLayerComputed () {
        const wrapper = this.$refs.wrapper
        const wrapperWidth = wrapper.offsetWidth
        const wrapperHeight = wrapper.offsetHeight
        this.$refs.innerWrapper.style.width = `${wrapperWidth}px`
        this.$refs.innerWrapper.style.height = `${wrapperHeight}px`

        const innerWrapper = this.$refs.innerWrapper
        const childrenArr = Array.from(innerWrapper.children)

        const getMinLength = (min, value) => {
          if (min === undefined) {
            min = value
          } else {
            min = min > value ? value : min
          }
          return min
        }

        const getMaxLength = (max, value) => {
          if (max === undefined) {
            max = value
          } else {
            max = max < value ? value : max
          }
          return max
        }

        let minLeft
        let maxRight
        let minTop
        let maxBottom
        childrenArr.forEach(item => {
          const temp = item.getBoundingClientRect()
          minLeft = getMinLength(minLeft, temp.left)
          minTop = getMinLength(minTop, temp.top)
          maxRight = getMaxLength(maxRight, temp.right)
          maxBottom = getMaxLength(maxBottom, temp.bottom)
        })

        const width = maxRight - minLeft
        const height = maxBottom - minTop
        this.$refs.scrollContent.style.width = `${width}px`
        this.$refs.scrollContent.style.height = `${height}px`
      },
      refresh () {
        if (this.bs) this.bs.refresh()
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

      const innerWrapper = createElement('div', {
        ref: 'innerWrapper'
      }, this.$slots.default)

      const content = createElement('div', {
        class: 'mpx-scroll-view-content',
        ref: 'scrollContent'
      }, [innerWrapper])

      return createElement('div', data, [content])
    }
  }
</script>

<style lang="stylus">
  .mpx-scroll-view
    overflow hidden
    position relative
</style>
