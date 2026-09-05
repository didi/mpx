<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :class="{
      'analytics-scroll--x': scrollX,
      'analytics-scroll--y': scrollY
    }"
    @scroll.passive="handleScroll"
  >
    <slot />
  </div>
</template>

<script>
function numberValue (value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

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
      type: [Number, String],
      default: 0
    },
    scrollLeft: {
      type: [Number, String],
      default: 0
    },
    scrollIntoView: {
      type: String,
      default: ''
    },
    upperThreshold: {
      type: [Number, String],
      default: 50
    },
    lowerThreshold: {
      type: [Number, String],
      default: 50
    }
  },
  data () {
    return {
      lastScrollTop: 0,
      lastScrollLeft: 0,
      contentObserver: null,
      edgeState: {
        xUpper: false,
        yUpper: false,
        xLower: false,
        yLower: false
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
    },
    scrollX () {
      this.$nextTick(() => this.updateEdgeState(false))
    },
    scrollY () {
      this.$nextTick(() => this.updateEdgeState(false))
    }
  },
  mounted () {
    this.setScrollPosition('scrollTop', this.scrollTop)
    this.setScrollPosition('scrollLeft', this.scrollLeft)
    this.observeContent()
    this.$nextTick(() => {
      this.scrollToTarget()
      this.lastScrollTop = this.$refs.scroller.scrollTop
      this.lastScrollLeft = this.$refs.scroller.scrollLeft
      this.updateEdgeState(false)
    })
  },
  beforeDestroy () {
    if (this.contentObserver) {
      this.contentObserver.disconnect()
      this.contentObserver = null
    }
  },
  methods: {
    setScrollPosition (property, value) {
      const scroller = this.$refs.scroller
      if (!scroller) return
      const nextValue = Math.max(0, numberValue(value, 0))
      if (scroller[property] !== nextValue) scroller[property] = nextValue
    },
    findTarget (id) {
      const scroller = this.$refs.scroller
      if (!scroller || !id) return null
      const candidates = scroller.querySelectorAll('[id]')
      for (let index = 0; index < candidates.length; index += 1) {
        if (candidates[index].id === id) return candidates[index]
      }
      return null
    },
    observeContent () {
      if (typeof MutationObserver === 'undefined') return
      this.contentObserver = new MutationObserver(() => {
        if (this.scrollIntoView) this.$nextTick(this.scrollToTarget)
      })
      this.contentObserver.observe(this.$refs.scroller, {
        childList: true,
        subtree: true
      })
    },
    scrollToTarget () {
      const scroller = this.$refs.scroller
      const target = this.findTarget(this.scrollIntoView)
      if (!scroller || !target) return

      const scrollerRect = scroller.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      if (this.scrollX) {
        scroller.scrollLeft += targetRect.left - scrollerRect.left
      }
      if (this.scrollY) {
        scroller.scrollTop += targetRect.top - scrollerRect.top
      }
    },
    eventDetail () {
      const scroller = this.$refs.scroller
      return {
        scrollLeft: scroller.scrollLeft,
        scrollTop: scroller.scrollTop,
        scrollWidth: scroller.scrollWidth,
        scrollHeight: scroller.scrollHeight,
        deltaX: scroller.scrollLeft - this.lastScrollLeft,
        deltaY: scroller.scrollTop - this.lastScrollTop
      }
    },
    calculateEdgeState () {
      const scroller = this.$refs.scroller
      const upper = Math.max(0, numberValue(this.upperThreshold, 50))
      const lower = Math.max(0, numberValue(this.lowerThreshold, 50))
      return {
        xUpper: this.scrollX && scroller.scrollLeft <= upper,
        yUpper: this.scrollY && scroller.scrollTop <= upper,
        xLower: this.scrollX && scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft <= lower,
        yLower: this.scrollY && scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop <= lower
      }
    },
    updateEdgeState (emitEvents, detail) {
      const next = this.calculateEdgeState()
      const enteredUpper = (next.xUpper && !this.edgeState.xUpper) ||
        (next.yUpper && !this.edgeState.yUpper)
      const enteredLower = (next.xLower && !this.edgeState.xLower) ||
        (next.yLower && !this.edgeState.yLower)
      this.edgeState = next

      if (emitEvents && enteredUpper) this.$emit('scrolltoupper', detail)
      if (emitEvents && enteredLower) this.$emit('scrolltolower', detail)
    },
    handleScroll () {
      const detail = this.eventDetail()
      this.$emit('scroll', detail)
      this.updateEdgeState(true, detail)
      this.lastScrollTop = detail.scrollTop
      this.lastScrollLeft = detail.scrollLeft
    }
  }
}
</script>

<style scoped>
.analytics-scroll {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: hidden;
  -webkit-overflow-scrolling: touch;
}

.analytics-scroll--x {
  overflow-x: auto;
}

.analytics-scroll--y {
  overflow-y: auto;
}
</style>
