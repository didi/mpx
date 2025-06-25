<script>
  import { computed } from 'vue'
  import getInnerListeners, { getCustomEvent } from './getInnerListeners'
  import { processSize } from '../../utils'
  import BScroll from '@better-scroll/core'
  import PullDown from '@better-scroll/pull-down'
  import throttle from 'lodash/throttle'
  import debounce from 'lodash/debounce'

  BScroll.use(PullDown)

  let mutationObserver = null
  let resizeObserver = null

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
      scrollOptions: {
        type: Object,
        default: () => {
          return {}
        }
      },
      scrollIntoViewOffset: {
        type: Number,
        default: 0
      },
      scrollIntoView: String,
      scrollWithAnimation: Boolean,
      enableFlex: Boolean,
      enhanced: Boolean,
      refresherEnabled: Boolean,
      refresherTriggered: Boolean,
      enableSticky: Boolean,
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
    provide () {
      return {
        scrollOffset: computed(() => -this.lastY || 0),
        refreshVersion: computed(() => this.refreshVersion || 0)
      }
    },
    data () {
      return {
        isLoading: false,
        isAutoPullDown: true,
        currentX: 0,
        currentY: 0,
        lastX: 0,
        lastY: 0,
        lastContentWidth: 0,
        lastContentHeight: 0,
        lastWrapperWidth: 0,
        lastWrapperHeight: 0,
        refreshVersion: 0
      }
    },
    computed: {
      _scrollTop () {
        const size = processSize(this.scrollTop)
        this.currentY = size
        return size
      },
      _scrollLeft () {
        const size = processSize(this.scrollLeft)
        this.currentX = size
        return size
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
      },
      scroll () {
        return this.scrollX || this.scrollY
      }
    },
    mounted () {
      this.debounceRefresh = debounce(function () {
        this.refresh()
      }, 200, {
        leading: true,
        trailing: true
      })
      this.dispatchScrollTo = throttle(function (direction) {
        let eventName = 'scrolltoupper'
        if (direction === 'bottom' || direction === 'right') eventName = 'scrolltolower'
        this.$emit(eventName, getCustomEvent(eventName, { direction }, this))
      }, 200, {
        leading: true,
        trailing: false
      })
      this.initBs()
      this.observeAnimation('add')
      this.handleMutationObserver()
    },
    activated () {
      if (!this.__mpx_deactivated) {
        return
      }
      this.__mpx_deactivated = false
      if (this.__mpx_deactivated_refresh) {
        this.__mpx_deactivated_refresh = false
        this.refresh()
      }
    },
    deactivated () {
      this.__mpx_deactivated = true
    },

    beforeDestroy () {
      this.destroyBs()
      this.observeAnimation('remove')
      this.destroyMutationObserver()
    },
    watch: {
      scrollIntoView (val) {
        this.scrollToView(val, this.scrollWithAnimation ? 200 : 0, this.scrollX ? this.scrollIntoViewOffset : 0, this.scrollY ? this.scrollIntoViewOffset : 0)
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
            this.$emit('refresherrestore', getCustomEvent('refresherrestore', {}, this))
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
      },
      scroll (val) {
        if (val) {
          this.initBs()
        } else {
          this.disableBs()
        }
      }
    },
    methods: {
      observeAnimation (type) {
        const eventNames = ['transitionend', 'animationend']
        const  behaviorType = type === 'add' ? 'addEventListener' : 'removeEventListener'
        eventNames.forEach(eventName => {
          this.$refs.scrollContent?.[behaviorType](eventName, this.handleObserveAnimation)
        })
      },
      destroyBs () {
        if (!this.bs) return
        this.bs.destroy()
        delete this.bs
      },
      disableBs () {
        if (!this.bs) return
        this.bs.disable()
        this.currentX = -this.bs.x
        this.currentY = -this.bs.y
      },
      scrollTo ({ top, left, duration, animated}) {
        const scrollTop = this.scrollY ? top : this.bs.y
        const scrollLeft = this.scrollX ? left : this.bs.x
        this.bs?.scrollTo(-scrollLeft, -scrollTop, animated ? duration : 0)
      },
      handleScrollIntoView (selector, { offset, animated }) {
        this.scrollToView(selector, animated ? 200 : 0, this.scrollX ? offset : 0, this.scrollY ? offset : 0)
      },
      initBs () {
        this.destroyBs()
        this.initLayerComputed()
        if (this.scrollOptions.observeDOM) {
          console.warn('[Mpx runtime warn]The observeDOM attribute in scroll-view has been deprecated, please stop using it')
        }
        const originBsOptions = {
          startX: -this.currentX,
          startY: -this.currentY,
          scrollX: this.scrollX,
          scrollY: this.scrollY,
          probeType: 3,
          bounce: false,
          stopPropagation: true,
          bindToWrapper: true,
          eventPassthrough: (this.scrollX && 'vertical') || (this.scrollY && 'horizontal') || ''
        }
        if (this.refresherEnabled) {
          originBsOptions.bounce = true
          originBsOptions.pullDownRefresh = {
            threshold: this.refresherThreshold,
            stop: 56
          }
        }
        if(this.enableSticky) {
          originBsOptions.useTransition = false
        }
        const bsOptions = Object.assign({}, originBsOptions, this.scrollOptions, { observeDOM: false })
        this.bs = new BScroll(this.$refs.wrapper, bsOptions)
        this.lastX = -this.currentX
        this.lastY = -this.currentY
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
          }, this))
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
        }, this.enableSticky ? 0 : 30, {
          leading: true,
          trailing: true
        }))
        this.bs.on('scrollEnd', () => {
          this.currentX = -this.bs.x
          this.currentY = -this.bs.y
        })
        if (this.scrollIntoView) {
          this.scrollToView(this.scrollIntoView, this.scrollWithAnimation ? 200 : 0, this.scrollX ? this.scrollIntoViewOffset : 0, this.scrollY ? this.scrollIntoViewOffset : 0)
        }
        // 若开启自定义下拉刷新 或 开启 scroll-view 增强特性
        if (this.refresherEnabled || this.enhanced) {
          const actionsHandlerHooks = this.bs.scroller.actionsHandler.hooks
          actionsHandlerHooks.on('start', () => {
            if (this.enhanced) {
              this.$emit('dragstart', getCustomEvent('dragstart', {
                scrollLeft: this.bs.x ? this.bs.x * -1 : 0,
                scrollTop: this.bs.y ? this.bs.y * -1 : 0
              }, this))
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
              }, this))
            }
            if (this.refresherEnabled) {
              if (this.bs.y > 0 && this.bs.y < this.refresherThreshold && this.bs.movingDirectionY !== 1) {
                this.isAutoPullDown = false
                this.isLoading = false
                this.$emit('refresherpulling', getCustomEvent('refresherpulling', {}, this))
              }
            }
          })
          actionsHandlerHooks.on('end', () => {
            if (this.enhanced) {
              this.$emit('dragend', getCustomEvent('dragend', {
                scrollLeft: this.bs.x ? this.bs.x * -1 : 0,
                scrollTop: this.bs.y ? this.bs.y * -1 : 0
              }, this))
            }
          })
          if (this.refresherEnabled) {
            // 下拉结束其他钩子都被bs阻止了，只有touchEnd可以触发
            this.bs.scroller.hooks.on('touchEnd', () => {
              if (this.bs.y > 0 && this.bs.movingDirectionY !== 1) {
                this.isLoading = true
                if (this.bs.y < this.refresherThreshold) {
                  this.isAutoPullDown = true
                  this.$emit('refresherabort', getCustomEvent('refresherabort', {}, this))
                }
              }
            })

            this.bs.on('pullingDown', () => {
              this.$emit('refresherrefresh', getCustomEvent('refresherrefresh', {}, this))
            })
          }
        }
      },
      scrollToView (id, duration = 0, offsetX = 0, offsetY = 0) {
        if (!id) return
        id = '#' + id
        if (!document.querySelector(id)) return // 不存在元素时阻断，直接调用better-scroll的方法会报错
        this.bs?.scrollToElement(id, duration, offsetX, offsetY)
      },
      initLayerComputed () {
        const wrapper = this.$refs.wrapper
        const scrollWrapperWidth = wrapper?.clientWidth || 0
        const scrollWrapperHeight = wrapper?.clientHeight || 0
        if (wrapper) {
          const computedStyle = getComputedStyle(wrapper)
          // 考虑子元素样式可能会设置100%，如果直接继承 scrollContent 的样式可能会有问题
          // 所以使用 wrapper 作为 innerWrapper 的宽高参考依据
          this.$refs.innerWrapper.style.width = `${scrollWrapperWidth - parseInt(computedStyle.paddingLeft) - parseInt(computedStyle.paddingRight)}px`
          this.$refs.innerWrapper.style.height = `${scrollWrapperHeight - parseInt(computedStyle.paddingTop) - parseInt(computedStyle.paddingBottom)}px`
        }
        const innerWrapper = this.$refs.innerWrapper
        const childrenArr = innerWrapper ? Array.from(innerWrapper.children) : []

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
            const left = item.offsetLeft
            const top = item.offsetTop
            const width = item.offsetWidth
            const height = item.offsetHeight
    
            minLeft = getMinLength(minLeft, left)
            minTop = getMinLength(minTop, top)
            maxRight = getMaxLength(maxRight, left + width)
            maxBottom = getMaxLength(maxBottom, top + height)
        })
        const width = maxRight - minLeft || 0
        const height = maxBottom - minTop || 0
        if (this.$refs.scrollContent) {
          this.$refs.scrollContent.style.width = `${width}px`
          this.$refs.scrollContent.style.height = `${height}px`
        }
        return {
          scrollContentWidth: width,
          scrollContentHeight: height,
          scrollWrapperWidth,
          scrollWrapperHeight
        }
      },
      refresh () {
        if (this.__mpx_deactivated) {
          this.__mpx_deactivated_refresh = true
          return
        }
        const { scrollContentWidth, scrollContentHeight,  scrollWrapperWidth, scrollWrapperHeight} = this.initLayerComputed()
        if (!this.compare(scrollWrapperWidth, this.lastWrapperWidth) || !this.compare(scrollWrapperHeight, this.lastWrapperHeight) || !this.compare(scrollContentWidth, this.lastContentWidth) || !this.compare(scrollContentHeight, this.lastContentHeight)) {
          this.lastContentWidth = scrollContentWidth
          this.lastContentHeight = scrollContentHeight
          this.lastWrapperWidth = scrollWrapperWidth
          this.lastWrapperHeight = scrollWrapperHeight
          this.refreshVersion++
          if (this.bs) this.bs.refresh()
        }
      },
      compare(num1, num2, scale = 1) {
        return Math.abs(num1 - num2) < scale
      },
      handleMutationObserver () {
        if (typeof MutationObserver !== 'undefined') {
          mutationObserver = new MutationObserver((mutations) => this.mutationObserverHandler(mutations))
          const config = { attributes: true, childList: true, subtree: true }
          mutationObserver.observe(this.$refs.wrapper, config)
        }
        if (typeof ResizeObserver !== 'undefined') {
          let isFirstResize = true
          resizeObserver = new ResizeObserver(() => {
            if (isFirstResize) {
              isFirstResize = false
              return
            }
            this.debounceRefresh()
          })
          resizeObserver.observe(this.$refs.wrapper)
        }
      },
       mutationObserverHandler (mutations) {
        let needRefresh = false
        for (let i = 0; i < mutations.length; i++) {
          const mutation = mutations[i]
          if (mutation.type !== 'attributes') {
             needRefresh = true
            break
          } else {
            if (mutation.target !== this.$refs.scrollContent && mutation.target !== this.$refs.innerWrapper) {
              needRefresh = true
              break
            }
          }
        }
        if (needRefresh) {
          this.debounceRefresh()
        }
      },
      handleObserveAnimation (e) {
        if (e.target !== this.$refs.scrollContent) {
          this.debounceRefresh()
        }
      },
      destroyMutationObserver () {
        if (mutationObserver) {
          mutationObserver.disconnect()
          mutationObserver = null
        }
        if (resizeObserver) {
          resizeObserver.disconnect()
          resizeObserver = null
        }
      }
    },
    render (createElement) {
      const data = {
        class: 'mpx-scroll-view',
        on: getInnerListeners(this, { ignoredListeners: ['scroll', 'scrolltoupper', 'scrolltolower'] }),
        ref: 'wrapper'
      }

      const innerWrapper = createElement('div', {
        ref: 'innerWrapper',
        class: 'mpx-inner-wrapper'
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
      ) : this.$slots.refresher
        ? createElement('div', {
          class: 'mpx-pull-down-slot',
        }, this.$slots.refresher)
        : null

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

      .mpx-pull-down-slot
        position: absolute
        width: 100%
        height: auto
        bottom: 0

      .mpx-pull-down-content-black
        .circle
          display: inline-block;
          margin-right: 5px
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(0, 0, 0, .3);

        &.active
          .circle-a
            animation: blackLoading 1s 0s infinite

          .circle-b
            animation: blackLoading 1s 0.3s infinite

          .circle-c
            animation: blackLoading 1s 0.6s infinite

          @keyframes blackLoading
            0%
              background: rgba(0, 0, 0, .8);
            100%
              background: rgba(0, 0, 0, .3)

      .mpx-pull-down-content-white
        .circle
          display: inline-block;
          margin-right: 5px
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, .3)

        &.active
          .circle-a
            animation: whiteLoading 1s 0s infinite;

          .circle-b
            animation: whiteLoading 1s 0.3s infinite;

          .circle-c
            animation: whiteLoading 1s 0.6s infinite;

          @keyframes whiteLoading
            0%
              background: rgba(255, 255, 255, .7)
            100%
              background: rgba(255, 255, 255, .3)
</style>