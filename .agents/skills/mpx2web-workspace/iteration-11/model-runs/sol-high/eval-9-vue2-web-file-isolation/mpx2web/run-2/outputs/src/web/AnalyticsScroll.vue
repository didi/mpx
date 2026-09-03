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
function toNumber (value, fallback) {
  const result = Number(value)
  return Number.isFinite(result) ? result : fallback
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
      mutationObserver: null,
      intoViewScheduled: false,
      previousTop: 0,
      previousLeft: 0,
      edgeState: {
        upperY: false,
        upperX: false,
        lowerY: false,
        lowerX: false
      }
    }
  },
  computed: {
    scrollStyle () {
      return {
        overflowX: this.scrollX ? 'auto' : 'hidden',
        overflowY: this.scrollY ? 'auto' : 'hidden',
        WebkitOverflowScrolling: 'touch'
      }
    }
  },
  watch: {
    scrollTop (value) {
      this.syncScrollTop(value)
    },
    scrollLeft (value) {
      this.syncScrollLeft(value)
    },
    scrollIntoView () {
      this.scheduleScrollIntoView()
    },
    scrollX () {
      this.resetDisabledAxis()
    },
    scrollY () {
      this.resetDisabledAxis()
    }
  },
  mounted () {
    this.syncScrollTop(this.scrollTop)
    this.syncScrollLeft(this.scrollLeft)
    this.previousTop = this.$refs.scroller.scrollTop
    this.previousLeft = this.$refs.scroller.scrollLeft
    this.observeChildren()
    this.scheduleScrollIntoView()
  },
  beforeDestroy () {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }
    this.intoViewScheduled = false
  },
  methods: {
    syncScrollTop (value) {
      this.$nextTick(() => {
        if (this.$refs.scroller && this.scrollY) {
          this.$refs.scroller.scrollTop = Math.max(0, toNumber(value, 0))
        }
      })
    },
    syncScrollLeft (value) {
      this.$nextTick(() => {
        if (this.$refs.scroller && this.scrollX) {
          this.$refs.scroller.scrollLeft = Math.max(0, toNumber(value, 0))
        }
      })
    },
    resetDisabledAxis () {
      this.$nextTick(() => {
        const scroller = this.$refs.scroller
        if (!scroller) return
        if (!this.scrollY) scroller.scrollTop = 0
        if (!this.scrollX) scroller.scrollLeft = 0
        this.previousTop = scroller.scrollTop
        this.previousLeft = scroller.scrollLeft
        this.resetEdgeState()
      })
    },
    observeChildren () {
      if (typeof MutationObserver === 'undefined') return
      this.mutationObserver = new MutationObserver(() => {
        this.scheduleScrollIntoView()
      })
      this.mutationObserver.observe(this.$refs.scroller, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['id']
      })
    },
    scheduleScrollIntoView () {
      if (!this.scrollIntoView || this.intoViewScheduled) return
      this.intoViewScheduled = true
      this.$nextTick(() => {
        this.intoViewScheduled = false
        this.syncScrollIntoView()
      })
    },
    syncScrollIntoView () {
      const scroller = this.$refs.scroller
      const targetId = this.scrollIntoView
      if (!scroller || !targetId) return

      const target = Array.prototype.find.call(
        scroller.querySelectorAll('[id]'),
        (node) => node.id === targetId
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
    makeDetail (scroller, deltaX, deltaY) {
      return {
        scrollTop: scroller.scrollTop,
        scrollLeft: scroller.scrollLeft,
        scrollHeight: scroller.scrollHeight,
        scrollWidth: scroller.scrollWidth,
        deltaX,
        deltaY
      }
    },
    handleScroll () {
      const scroller = this.$refs.scroller
      if (!scroller) return

      const deltaX = scroller.scrollLeft - this.previousLeft
      const deltaY = scroller.scrollTop - this.previousTop
      this.previousLeft = scroller.scrollLeft
      this.previousTop = scroller.scrollTop

      const detail = this.makeDetail(scroller, deltaX, deltaY)
      this.$emit('scroll', detail)
      this.emitEdgeEvents(scroller, detail)
    },
    emitEdgeEvents (scroller, detail) {
      const upper = Math.max(0, toNumber(this.upperThreshold, 50))
      const lower = Math.max(0, toNumber(this.lowerThreshold, 50))
      const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
      const maxLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)

      this.updateEdge(
        'upperY',
        this.scrollY && maxTop > 0 && scroller.scrollTop <= upper,
        'scrolltoupper',
        'top',
        detail
      )
      this.updateEdge(
        'upperX',
        this.scrollX && maxLeft > 0 && scroller.scrollLeft <= upper,
        'scrolltoupper',
        'left',
        detail
      )
      this.updateEdge(
        'lowerY',
        this.scrollY && maxTop > 0 && maxTop - scroller.scrollTop <= lower,
        'scrolltolower',
        'bottom',
        detail
      )
      this.updateEdge(
        'lowerX',
        this.scrollX && maxLeft > 0 && maxLeft - scroller.scrollLeft <= lower,
        'scrolltolower',
        'right',
        detail
      )
    },
    updateEdge (key, inside, eventName, direction, detail) {
      if (inside && !this.edgeState[key]) {
        this.$emit(eventName, Object.assign({ direction }, detail))
      }
      this.edgeState[key] = inside
    },
    resetEdgeState () {
      Object.keys(this.edgeState).forEach((key) => {
        this.edgeState[key] = false
      })
    }
  }
}
</script>

<style scoped>
.analytics-scroll {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}
</style>
