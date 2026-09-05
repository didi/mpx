<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :style="overflowStyle"
    @scroll="handleScroll"
  >
    <slot />
  </div>
</template>

<script>
function toNumber (value, fallback = 0) {
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
      atUpperEdge: false,
      atLowerEdge: false,
      targetObserver: null,
      pendingTargetId: ''
    }
  },
  computed: {
    overflowStyle () {
      return {
        overflowX: this.scrollX ? 'auto' : 'hidden',
        overflowY: this.scrollY ? 'auto' : 'hidden'
      }
    }
  },
  watch: {
    scrollTop: {
      immediate: true,
      handler (value) {
        this.setScrollPosition('scrollTop', value)
      }
    },
    scrollLeft: {
      immediate: true,
      handler (value) {
        this.setScrollPosition('scrollLeft', value)
      }
    },
    scrollIntoView: {
      immediate: true,
      handler (id) {
        this.scheduleTargetScroll(id)
      }
    }
  },
  mounted () {
    const scroller = this.$refs.scroller
    if (!scroller) return
    this.lastScrollTop = scroller.scrollTop
    this.lastScrollLeft = scroller.scrollLeft
    this.updateEdgeState(scroller, null, false)
  },
  beforeDestroy () {
    this.stopTargetObserver()
  },
  methods: {
    setScrollPosition (property, value) {
      this.$nextTick(() => {
        const scroller = this.$refs.scroller
        if (!scroller) return
        const nextValue = Math.max(0, toNumber(value))
        if (scroller[property] !== nextValue) scroller[property] = nextValue
      })
    },
    scheduleTargetScroll (id) {
      this.stopTargetObserver()
      if (!id) return
      this.pendingTargetId = id
      this.$nextTick(() => {
        if (this.pendingTargetId !== id) return
        if (this.moveTargetIntoView(id)) {
          this.pendingTargetId = ''
          return
        }
        this.observeForTarget(id)
      })
    },
    observeForTarget (id) {
      const scroller = this.$refs.scroller
      if (!scroller || typeof MutationObserver === 'undefined') return
      this.targetObserver = new MutationObserver(() => {
        if (this.pendingTargetId === id && this.moveTargetIntoView(id)) {
          this.stopTargetObserver()
        }
      })
      this.targetObserver.observe(scroller, { childList: true, subtree: true })
    },
    stopTargetObserver () {
      if (this.targetObserver) {
        this.targetObserver.disconnect()
        this.targetObserver = null
      }
      this.pendingTargetId = ''
    },
    moveTargetIntoView (id) {
      const scroller = this.$refs.scroller
      if (!scroller) return false

      const target = Array.prototype.find.call(
        scroller.querySelectorAll('[id]'),
        (node) => node.id === id
      )
      if (!target) return false

      const scrollerRect = scroller.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      if (this.scrollX) {
        scroller.scrollLeft += targetRect.left - scrollerRect.left
      }
      if (this.scrollY) {
        scroller.scrollTop += targetRect.top - scrollerRect.top
      }
      return true
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
      this.$emit('scroll', { detail })
      this.updateEdgeState(scroller, detail, true)
    },
    updateEdgeState (scroller, detail, shouldEmit) {
      const upperThreshold = Math.max(0, toNumber(this.upperThreshold, 50))
      const lowerThreshold = Math.max(0, toNumber(this.lowerThreshold, 50))
      const atUpper = this.scrollY
        ? scroller.scrollTop <= upperThreshold
        : this.scrollX && scroller.scrollLeft <= upperThreshold
      const atLower = this.scrollY
        ? scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - lowerThreshold
        : this.scrollX &&
          scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - lowerThreshold

      if (shouldEmit && atUpper && !this.atUpperEdge) {
        this.$emit('scrolltoupper', { detail: detail || this.createScrollDetail(scroller) })
      }
      if (shouldEmit && atLower && !this.atLowerEdge) {
        this.$emit('scrolltolower', { detail: detail || this.createScrollDetail(scroller) })
      }
      this.atUpperEdge = atUpper
      this.atLowerEdge = atLower
    },
    createScrollDetail (scroller) {
      return {
        scrollTop: scroller.scrollTop,
        scrollLeft: scroller.scrollLeft,
        scrollHeight: scroller.scrollHeight,
        scrollWidth: scroller.scrollWidth,
        deltaX: 0,
        deltaY: 0
      }
    }
  }
}
</script>

<style>
.analytics-scroll {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  -webkit-overflow-scrolling: touch;
}
</style>
