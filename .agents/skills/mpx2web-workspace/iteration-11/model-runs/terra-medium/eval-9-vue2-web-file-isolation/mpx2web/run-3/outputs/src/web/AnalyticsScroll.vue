<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :class="$attrs.class"
    :style="scrollStyle"
    v-bind="forwardedAttrs"
    v-on="forwardedListeners"
    @scroll="handleNativeScroll"
  >
    <slot />
  </div>
</template>

<script>
const BOUNDARY_LISTENERS = ['scroll', 'scrolltoupper', 'scrolltolower']

export default {
  name: 'AnalyticsScroll',
  inheritAttrs: false,
  props: {
    scrollX: { type: Boolean, default: false },
    scrollY: { type: Boolean, default: false },
    scrollTop: { type: [Number, String], default: 0 },
    scrollLeft: { type: [Number, String], default: 0 },
    scrollIntoView: { type: String, default: '' },
    upperThreshold: { type: [Number, String], default: 50 },
    lowerThreshold: { type: [Number, String], default: 50 },
    scrollWithAnimation: { type: Boolean, default: false }
  },
  data () {
    return {
      lastTop: 0,
      lastLeft: 0,
      activeEdges: Object.create(null),
      resizeObserver: null,
      mutationObserver: null,
      refreshQueued: false
    }
  },
  computed: {
    scrollStyle () {
      return {
        overflowX: this.scrollX ? 'auto' : 'hidden',
        overflowY: this.scrollY ? 'auto' : 'hidden'
      }
    },
    forwardedAttrs () {
      const attrs = Object.assign({}, this.$attrs)
      delete attrs.class
      delete attrs.style
      return attrs
    },
    forwardedListeners () {
      const listeners = Object.assign({}, this.$listeners)
      BOUNDARY_LISTENERS.forEach((name) => delete listeners[name])
      return listeners
    }
  },
  watch: {
    scrollTop () {
      this.setPosition({ top: this.numberValue(this.scrollTop) })
    },
    scrollLeft () {
      this.setPosition({ left: this.numberValue(this.scrollLeft) })
    },
    scrollIntoView () {
      this.scrollToTarget()
    }
  },
  mounted () {
    this.syncPosition()
    this.installObservers()
  },
  beforeDestroy () {
    if (this.resizeObserver) this.resizeObserver.disconnect()
    if (this.mutationObserver) this.mutationObserver.disconnect()
    this.resizeObserver = null
    this.mutationObserver = null
  },
  methods: {
    numberValue (value) {
      const number = Number(value)
      return Number.isFinite(number) ? number : 0
    },
    syncPosition () {
      this.$nextTick(() => {
        this.setPosition({
          top: this.numberValue(this.scrollTop),
          left: this.numberValue(this.scrollLeft)
        })
        this.scrollToTarget()
      })
    },
    setPosition ({ top, left }) {
      const scroller = this.$refs.scroller
      if (!scroller) return
      const behavior = this.scrollWithAnimation ? 'smooth' : 'auto'
      const nextTop = top === undefined ? scroller.scrollTop : top
      const nextLeft = left === undefined ? scroller.scrollLeft : left
      if (typeof scroller.scrollTo === 'function') {
        scroller.scrollTo({ top: nextTop, left: nextLeft, behavior })
      } else {
        scroller.scrollTop = nextTop
        scroller.scrollLeft = nextLeft
      }
    },
    scrollToTarget () {
      const id = this.scrollIntoView
      if (!id) return
      this.$nextTick(() => {
        const scroller = this.$refs.scroller
        if (!scroller) return
        const target = Array.prototype.find.call(scroller.querySelectorAll('[id]'), (node) => node.id === id)
        if (!target) return
        const rootRect = scroller.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()
        this.setPosition({
          top: this.scrollY ? scroller.scrollTop + targetRect.top - rootRect.top : undefined,
          left: this.scrollX ? scroller.scrollLeft + targetRect.left - rootRect.left : undefined
        })
      })
    },
    installObservers () {
      const scroller = this.$refs.scroller
      if (!scroller) return
      const queueRefresh = () => {
        if (this.refreshQueued) return
        this.refreshQueued = true
        this.$nextTick(() => {
          this.refreshQueued = false
          this.scrollToTarget()
          this.updateBoundaryState()
        })
      }
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(queueRefresh)
        this.resizeObserver.observe(scroller)
      }
      if (typeof MutationObserver !== 'undefined') {
        this.mutationObserver = new MutationObserver(queueRefresh)
        this.mutationObserver.observe(scroller, { childList: true, subtree: true })
      }
    },
    handleNativeScroll () {
      const scroller = this.$refs.scroller
      if (!scroller) return
      const detail = {
        scrollTop: scroller.scrollTop,
        scrollLeft: scroller.scrollLeft,
        scrollHeight: scroller.scrollHeight,
        scrollWidth: scroller.scrollWidth,
        deltaX: scroller.scrollLeft - this.lastLeft,
        deltaY: scroller.scrollTop - this.lastTop
      }
      this.lastTop = scroller.scrollTop
      this.lastLeft = scroller.scrollLeft
      this.$emit('scroll', detail)
      this.updateBoundaryState(detail)
    },
    updateBoundaryState (detail) {
      const scroller = this.$refs.scroller
      if (!scroller) return
      const value = detail || {
        scrollTop: scroller.scrollTop,
        scrollLeft: scroller.scrollLeft,
        scrollHeight: scroller.scrollHeight,
        scrollWidth: scroller.scrollWidth,
        deltaX: 0,
        deltaY: 0
      }
      const upper = this.numberValue(this.upperThreshold)
      const lower = this.numberValue(this.lowerThreshold)
      if (this.scrollY) {
        this.updateEdge('top', value.scrollTop <= upper, 'scrolltoupper', value)
        this.updateEdge('bottom', value.scrollHeight - scroller.clientHeight - value.scrollTop <= lower, 'scrolltolower', value)
      }
      if (this.scrollX) {
        this.updateEdge('left', value.scrollLeft <= upper, 'scrolltoupper', value)
        this.updateEdge('right', value.scrollWidth - scroller.clientWidth - value.scrollLeft <= lower, 'scrolltolower', value)
      }
    },
    updateEdge (direction, isActive, eventName, detail) {
      if (!isActive) {
        this.$delete(this.activeEdges, direction)
        return
      }
      if (this.activeEdges[direction]) return
      this.$set(this.activeEdges, direction, true)
      this.$emit(eventName, Object.assign({ direction }, detail))
    }
  }
}
</script>

<style scoped>
.analytics-scroll {
  box-sizing: border-box;
}
</style>
