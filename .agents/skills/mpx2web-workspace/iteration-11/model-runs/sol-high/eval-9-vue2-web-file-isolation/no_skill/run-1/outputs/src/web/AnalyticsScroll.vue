<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :style="scrollStyle"
    @scroll="handleScroll"
  >
    <slot />
  </div>
</template>

<script>
export default {
  name: 'AnalyticsScroll',
  props: {
    scrollX: {
      type: Boolean,
      default: false
    },
    scrollY: {
      type: Boolean,
      default: false
    },
    scrollTop: {
      type: Number,
      default: 0
    },
    scrollLeft: {
      type: Number,
      default: 0
    },
    scrollIntoView: {
      type: String,
      default: ''
    },
    upperThreshold: {
      type: Number,
      default: 50
    },
    lowerThreshold: {
      type: Number,
      default: 50
    }
  },
  data () {
    return {
      lastScrollTop: 0,
      lastScrollLeft: 0,
      edgeState: {
        top: false,
        left: false,
        bottom: false,
        right: false
      }
    }
  },
  computed: {
    scrollStyle () {
      return {
        overflowX: this.scrollX ? 'auto' : 'hidden',
        overflowY: this.scrollY ? 'auto' : 'hidden'
      }
    }
  },
  watch: {
    scrollTop (value) {
      this.setScrollPosition('scrollTop', value)
    },
    scrollLeft (value) {
      this.setScrollPosition('scrollLeft', value)
    },
    scrollIntoView () {
      this.$nextTick(this.scrollToTarget)
    }
  },
  mounted () {
    const scroller = this.$refs.scroller
    scroller.scrollTop = this.normalisePosition(this.scrollTop)
    scroller.scrollLeft = this.normalisePosition(this.scrollLeft)
    this.lastScrollTop = scroller.scrollTop
    this.lastScrollLeft = scroller.scrollLeft
    this.$nextTick(this.scrollToTarget)
  },
  methods: {
    normalisePosition (value) {
      const position = Number(value)
      return Number.isFinite(position) ? Math.max(0, position) : 0
    },
    setScrollPosition (property, value) {
      const scroller = this.$refs.scroller
      if (!scroller) return

      const position = this.normalisePosition(value)
      if (scroller[property] !== position) {
        scroller[property] = position
      }
    },
    scrollToTarget () {
      const id = this.scrollIntoView
      const scroller = this.$refs.scroller
      if (!id || !scroller) return

      const target = Array.prototype.find.call(
        scroller.querySelectorAll('[id]'),
        (element) => element.id === id
      )
      if (!target) return

      const scrollerRect = scroller.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      if (this.scrollY) {
        scroller.scrollTop += targetRect.top - scrollerRect.top
      }
      if (this.scrollX) {
        scroller.scrollLeft += targetRect.left - scrollerRect.left
      }
    },
    handleScroll (event) {
      const scroller = event.currentTarget
      const scrollTop = scroller.scrollTop
      const scrollLeft = scroller.scrollLeft
      const detail = {
        scrollTop,
        scrollLeft,
        scrollHeight: scroller.scrollHeight,
        scrollWidth: scroller.scrollWidth,
        deltaX: scrollLeft - this.lastScrollLeft,
        deltaY: scrollTop - this.lastScrollTop
      }

      this.lastScrollTop = scrollTop
      this.lastScrollLeft = scrollLeft
      this.$emit('scroll', detail)
      this.emitEdgeEvents(scroller, detail)
    },
    emitEdgeEvents (scroller, detail) {
      const upper = this.normalisePosition(this.upperThreshold)
      const lower = this.normalisePosition(this.lowerThreshold)
      const nextState = {
        top: this.scrollY && scroller.scrollTop <= upper,
        left: this.scrollX && scroller.scrollLeft <= upper,
        bottom: this.scrollY && scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop <= lower,
        right: this.scrollX && scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft <= lower
      }

      if (nextState.top && !this.edgeState.top) {
        this.$emit('scrolltoupper', { ...detail, direction: 'top' })
      }
      if (nextState.left && !this.edgeState.left) {
        this.$emit('scrolltoupper', { ...detail, direction: 'left' })
      }
      if (nextState.bottom && !this.edgeState.bottom) {
        this.$emit('scrolltolower', { ...detail, direction: 'bottom' })
      }
      if (nextState.right && !this.edgeState.right) {
        this.$emit('scrolltolower', { ...detail, direction: 'right' })
      }

      this.edgeState = nextState
    }
  }
}
</script>

<style scoped>
.analytics-scroll {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  -webkit-overflow-scrolling: touch;
}
</style>
