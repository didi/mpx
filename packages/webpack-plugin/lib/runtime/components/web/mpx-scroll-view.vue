<script>
  import getInnerListeners, { getCustomEvent } from './getInnerListeners'
  import { processSize } from './util'
  import BScroll from '@better-scroll/core'
  import PullDown from '@better-scroll/pull-down'
  import ObserveDom from '@better-scroll/observe-dom'
  import throttle from 'lodash/throttle'

  BScroll.use(ObserveDom)
  BScroll.use(PullDown)

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
      enableFlex: Boolean,
      enhanced:Boolean,
      refresherEnabled: Boolean,
      refresherTriggered: Boolean,
      refresherThreshold: {
        type: Number,
        default: 45
      },
      refresherDefaultStyle: {
        type: String,
        default: 'black'
      },
      refresherBackground: {
        type: String,
        default: ''
      }
    },
    data () {
      return {
        isLoading: false,
        isAutoPullDown: true
      }
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
      },
      _pullDownWrapperStyle () {
        return `background:${this.refresherBackground}`
      },
      _pullDownContentClassName () {
        let className = 'mpx-pull-down-content'
        if (this.refresherDefaultStyle === 'black') {
          className += ' mpx-pull-down-content-black'
        } else if (this.refresherDefaultStyle === 'white') {
          className += ' mpx-pull-down-content-white'
        }
        if (this.isLoading) {
          className += ' active'
        }
        return className
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
      },
      refresherTriggered: {
        handler (val) {
          if (!val) {
            this.$emit('refresherrestore')
            this.isLoading = false
            this.isAutoPullDown = true
            this.bs && this.bs.finishPullDown()
            this.bs && this.bs.refresh()
          } else {
            if (this.isAutoPullDown) {
              this.isLoading = true
              this.bs.autoPullDownRefresh()
            }
          }
        },
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
          bounce: false,
          stopPropagation: true,
          bindToWrapper: true
        }
        if (this.refresherEnabled) {
          originBsOptions.bounce = true
          originBsOptions.pullDownRefresh = {
            threshold: this.refresherThreshold,
            stop: 56
          }
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
        // 若开启自定义下拉刷新 或 开启 scroll-view 增强特性
        if (this.refresherEnabled || this.enhanced) {
          const actionsHandlerHooks = this.bs.scroller.actionsHandler.hooks
          actionsHandlerHooks.on('start', () => {
            if (this.enhanced) {
              this.$emit('dragstart', getCustomEvent('dragstart', {
                scrollLeft: this.bs.x ? this.bs.x * -1 : 0,
                scrollTop: this.bs.y ? this.bs.y * -1 : 0
              }))
            }
            if (this.refresherEnabled) {
              this.isAutoPullDown = false
            }
          })
          actionsHandlerHooks.on('move', () => {
            if (this.enhanced) {
              this.$emit('dragging', getCustomEvent('dragging', {
                scrollLeft: this.bs.x ? this.bs.x * -1 : 0,
                scrollTop: this.bs.y ? this.bs.y * -1 : 0
              }))
            }
            if (this.refresherEnabled) {
              if (this.bs.y > 0 && this.bs.y < this.refresherThreshold && this.bs.movingDirectionY !== 1) {
                this.isAutoPullDown = false
                this.isLoading = false
                this.$emit('refresherpulling')
              }
            }
          })
          actionsHandlerHooks.on('end', () => {
            if (this.enhanced) {
              this.$emit('dragend', getCustomEvent('dragend', {
                scrollLeft: this.bs.x ? this.bs.x * -1 : 0,
                scrollTop: this.bs.y ? this.bs.y * -1 : 0
              }))
            }
          })
          if (this.refresherEnabled) {
            // 下拉结束其他钩子都被bs阻止了，只有touchEnd可以触发
            this.bs.scroller.hooks.on('touchEnd', () => {
              if (this.bs.y > 0 && this.bs.movingDirectionY !== 1) {
                this.isLoading = true
                if (this.bs.y < this.refresherThreshold) {
                  this.isAutoPullDown = true
                  this.$emit('refresherabort')
                }
              }
            })
            this.bs.on('pullingDown', () => {
              this.$emit('refresherrefresh')
            })
          }
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

      const pullDownContent = this.refresherDefaultStyle !== 'none' ? createElement('div', {
          class: this._pullDownContentClassName,
        }, [
          createElement('div', {
            class: 'circle circle-a'
          }),
          createElement('div', {
            class: 'circle circle-b'
          }),
          createElement('div', {
            class: 'circle circle-c'
          }),
        ]
      ) : null

      const pullDownWrapper = this.refresherEnabled ? createElement('div', {
        class: 'mpx-pull-down-wrapper',
        style: this._pullDownWrapperStyle
      }, [pullDownContent]) : null

      const content = createElement('div', {
        class: 'mpx-scroll-view-content',
        ref: 'scrollContent'
      }, [pullDownWrapper, innerWrapper])

      return createElement('div', data, [content])
    }
  }
</script>

<style lang="stylus">
  .mpx-scroll-view
    overflow hidden
    position relative
    .mpx-pull-down-wrapper
      position: absolute
      width: 100%
      height: 250px
      box-sizing: border-box
      transform: translateY(-100%) translateZ(0)
      .mpx-pull-down-content
        position: absolute
        bottom: 20px
        left: 50%
        transform: translateX(-50%)
      .mpx-pull-down-content-black
        .circle
          display: inline-block;
          margin-right: 5px
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(0,0,0,.3);
        &.active
          .circle-a
            animation: blackLoading 1s 0s infinite
          .circle-b
            animation: blackLoading 1s 0.3s infinite
          .circle-c
            animation: blackLoading 1s 0.6s infinite
          @keyframes blackLoading
            0%
              background: rgba(0,0,0,.8);
            100%
              background: rgba(0,0,0,.3)

      .mpx-pull-down-content-white
        .circle
          display: inline-block;
          margin-right: 5px
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,.3)
        &.active
          .circle-a
            animation: whiteLoading 1s 0s infinite;
          .circle-b
            animation: whiteLoading 1s 0.3s infinite;
          .circle-c
            animation: whiteLoading 1s 0.6s infinite;
          @keyframes whiteLoading
            0%
              background: rgba(255,255,255,.7)
            100%
              background: rgba(255,255,255,.3)
</style>
