<script>
  import getInnerListeners, { getCustomEvent } from './getInnerListeners'
  import BScroll from '@better-scroll/core'
  import Slide from '@better-scroll/slide'
  import ObserveDOM from '@better-scroll/observe-dom'
  import throttle from 'lodash/throttle'
  import { processSize } from '../../utils'

  BScroll.use(Slide)
  BScroll.use(ObserveDOM)

  export default {
    name: 'mpx-swiper',
    props: {
      indicatorDots: Boolean,
      indicatorColor: {
        type: String,
        default: 'rgba(0, 0, 0, .3)'
      },
      indicatorActiveColor: {
        type: String,
        default: '#000000'
      },
      autoplay: Boolean,
      current: {
        type: Number,
        default: 0
      },
      interval: {
        type: Number,
        default: 5000
      },
      duration: {
        type: Number,
        default: 500
      },
      circular: Boolean,
      vertical: Boolean,
      easingFunction: {
        type: String,
        default: 'default'
      },
      previousMargin: String,
      nextMargin: String,
      scrollOptions: {
        type: Object,
        default: () => {
          return {}
        }
      }
    },
    data () {
      return {
        currentIndex: this.current,
        currentChildLength: 0,
        lastChildLength: 0,
        init: false
      }
    },
    computed: {
      easing () {
        switch (this.easingFunction) {
          case 'linear':
            return {
              style: 'linear',
              fn (t) {
                return t
              }
            }
          case 'easeInCubic':
            return {
              style: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
              fn (t) {
                return Math.pow(t, 3)
              }
            }
          case 'easeOutCubic':
            return {
              style: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
              fn (t) {
                return (Math.pow((t - 1), 3) + 1)
              }
            }
          case 'easeInOutCubic':
            return {
              style: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
              fn (t) {
                if ((t /= 0.5) < 1) return 0.5 * Math.pow(t, 3)
                return 0.5 * (Math.pow((t - 2), 3) + 2)
              }
            }
          default:
            return
        }
      },
      _previousMargin () {
        return processSize(this.previousMargin) || 0
      },
      _nextMargin () {
        return processSize(this.nextMargin) || 0
      },
    },
    updated () {
      this.setCurrentChildLength()
    },
    watch: {
      current (val) {
        this.currentIndex = val
        if (this.bs) {
          this.lastX = this.bs.x
          this.lastY = this.bs.y
        }
        this.changeSource = ''
        this.goto(val)
      },
      currentChildLength (val) {
        if (val < this.lastChildLength && val < this.currentIndex) {
          this.goto(0, 0)
        }
        if (this.lastChildLength || (!this.lastChildLength && !this.autoplay)) {
          this.bs && this.bs.refresh()
        }
        this.lastChildLength = val
      }
    },
    activated () {
      if (this.bs && this.autoplay) {
        this.bs.startPlay()
      }
    },
    deactivated () {
      if (this.bs && this.autoplay) {
        this.bs.pausePlay()
      }
    },
    beforeCreate () {
      this.itemIds = []
    },
    mounted () {
      if (!this.scrollOptions.closeResizeObserver) {
        this.createResizeObserver()
      }
      this.setCurrentChildLength()
      this.initBs()
    },
    beforeDestroy () {
      this.destroyBs()
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }
    },
    methods: {
      destroyBs () {
        if (!this.bs) return
        this.bs.destroy()
        delete this.bs
      },
      initLayerComputed () {
        const wrapper = this.$refs.wrapper
        const computedStyle = getComputedStyle(wrapper)
        const innerWrapper = this.$refs.innerWrapper
        let width = wrapper.clientWidth - parseInt(computedStyle.paddingLeft) - parseInt(computedStyle.paddingRight)
        let height = wrapper.clientHeight - parseInt(computedStyle.paddingTop) - parseInt(computedStyle.paddingBottom)
        if (!this.vertical) {
          if (this._previousMargin || this._nextMargin) {
            if (this._previousMargin) {
              innerWrapper.style.marginLeft = `${this._previousMargin}px`
              width = width - this._previousMargin
            }
            if (this._nextMargin) {
              width = width - this._nextMargin
            }
          }
        } else {
          if (this._previousMargin || this._nextMargin) {
            if (this._previousMargin) {
              innerWrapper.style.marginTop = `${this._previousMargin}px`
              height = height - this._previousMargin
            }
            if (this._nextMargin) {
              height = height - this._nextMargin
            }
          }
        }
        innerWrapper.style.height = `${height}px`
        innerWrapper.style.width = `${width}px`
      },
      initBs () {
        this.destroyBs()
        this.initLayerComputed()
        const originBsOptions = {
          scrollX: !this.vertical,
          scrollY: this.vertical,
          slide: {
            loop: this.circular,
            threshold: 0.5,
            speed: this.duration,
            easing: this.easing,
            interval: this.interval,
            autoplay: this.autoplay,
            startPageXIndex: this.vertical ? 0 : this.currentIndex,
            startPageYIndex: this.vertical ? this.currentIndex : 0
          },
          momentum: false,
          bounce: false,
          probeType: 3,
          bindToWrapper: true,
          stopPropagation: true
        }
        const bsOptions = Object.assign({}, originBsOptions, this.scrollOptions)
        this.bs = new BScroll(this.$refs.innerWrapper, bsOptions)
        this.bs.scroller.hooks.on('beforeRefresh', () => {
          this.initLayerComputed()
        })
        this.bs.on('slidePageChanged', (page) => {
          this.currentIndex = this.vertical ? page.pageY : page.pageX
          this.$emit('change', getCustomEvent('change', {
            current: this.currentIndex,
            currentItemId: this.itemIds[this.currentIndex] || '',
            source: this.changeSource
          }, this))
        })

        this.bs.on('scrollEnd', () => {
          this.$emit('animationfinish', getCustomEvent('animationfinish', {
            current: this.currentIndex,
            currentItemId: this.itemIds[this.currentIndex] || '',
            source: this.changeSource
          }, this))
        })
        this.bs.on('scroll', throttle(({ x, y }) => {
          this.$emit('transition', getCustomEvent('transition', {
            dx: this.lastX - x,
            dy: this.lastY - y
          }, this))
        }, 30, {
          leading: true,
          trailing: false
        }))

        this.bs.on('beforeScrollStart', () => {
          if (this.bs) {
            this.lastX = this.bs.x
            this.lastY = this.bs.y
          }
          this.changeSource = 'touch'
        })
      },
      createResizeObserver () {
        if (typeof ResizeObserver !== 'undefined'){
          this.resizeObserver = new ResizeObserver(entries => {
            if (!this.init) {
              this.init = true
              return
            }
            this.initBs()
          })
          const elementToObserve = document.querySelector('.mpx-swiper');
          this.resizeObserver.observe(elementToObserve);
        }
      },
      refresh () {
        this.bs && this.bs.refresh()
      },
      goto (index, time) {
        const x = this.vertical ? 0 : index
        const y = this.vertical ? index : 0
        const speed = time === 0 ? 0 : this.duration
        this.bs && this.bs.goToPage(x, y, speed)
      },
      setCurrentChildLength () {
        this.currentChildLength = this.$children && this.$children.length
      }
    },
    render (createElement) {
      const data = {
        class: 'mpx-swiper',
        on: getInnerListeners(this, { ignoredListeners: ['change', 'animationfinish', 'transition'] }),
        ref: 'wrapper'
      }

      const content = createElement('div', {
        class: {
          'mpx-swiper-content': true,
          vertical: this.vertical
        }
      }, this.$slots.default)
      const children = [content]
      if (this.indicatorDots) {
        const items = this.$slots.default.filter((VNode) => VNode.tag && VNode.tag.endsWith('mpx-swiper-item'))
        items.forEach((VNode) => {
          this.itemIds.push(VNode.componentOptions.propsData.itemId || '')
        })
        const dotsLength = items.length
        const dotsItems = []
        for (let i = 0; i < dotsLength; i++) {
          dotsItems.push(
            createElement('span', {
              class: 'mpx-swiper-dots-item',
              style: {
                backgroundColor: i === this.currentIndex ? this.indicatorActiveColor : this.indicatorColor
              }
            })
          )
        }
        const dots = createElement('div', {
          class: {
            'mpx-swiper-dots': true,
            vertical: this.vertical
          }
        }, dotsItems)
        children.push(dots)
      }

      const innerWrapper = createElement('div', {
        ref: 'innerWrapper',
        class: {
          'mpx-swiper-wrapper': true
        }
      }, children)
      return createElement('div', data, [innerWrapper])
    }
  }
</script>

<style lang="stylus">
  .mpx-swiper
    overflow hidden
    position relative

  .mpx-swiper-content
    width 100%
    height 100%
    display flex

    &.vertical
      flex-direction column

    .mpx-swiper-item
      width 100%
      height 100%
      flex: 1 0 auto

  .mpx-swiper-dots
    position absolute
    right 50%
    bottom 4px
    transform translateX(50%)
    display flex

    &.vertical
      right 4px
      bottom 50%
      transform translateY(50%)
      flex-direction column

    .mpx-swiper-dots-item
      display block
      margin 4px
      width 8px
      height 8px
      border-radius 50%

</style>
