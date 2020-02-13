<script>
  import getInnerListeners, { getCustomEvent } from './getInnerListeners'
  import BScroll from '@better-scroll/core'
  import Slide from '@better-scroll/observe-dom'

  BScroll.use(Slide)

  export default {
    name: 'mpx-swiper',
    props: {},
    mounted () {
      this.bs = new BScroll(this.$refs.wrapper, {
        scrollX: true,
        scrollY: false,
        slide: {
          loop: true,
          threshold: 100
        },
        momentum: false,
        bounce: false,
        stopPropagation: true
      })
    },
    beforeDestroy () {
      this.bs && this.bs.destroy()
    },
    updated () {
      this.refresh()
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
        this.$emit(eventName, getCustomEvent(eventName, { direction }))
      }, 200, {
        leading: true,
        trailing: false
      })
    },
    render (createElement) {
      const data = {
        class: 'mpx-swiper',
        on: getInnerListeners(this),
        ref: 'wrapper'
      }
      const content = createElement('div', {
        class: 'mpx-swiper-content'
      }, this.$slots.default)
      return createElement('div', data, [content])
    }
  }
</script>

<style lang="stylus">
  .mpx-swiper
    overflow hidden
    position relative


</style>
