<template>
  <div
    ref="scroll"
    class="analytics-scroll"
    :class="axisClass"
    v-bind="$attrs"
    v-on="passthroughListeners"
    @scroll="handleScroll"
  >
    <slot />
  </div>
</template>

<script>
export default {
  name: 'AnalyticsScroll',
  inheritAttrs: false,
  props: {
    scrollX: { type: Boolean, default: false },
    scrollY: { type: Boolean, default: false },
    scrollTop: { type: Number, default: 0 },
    scrollLeft: { type: Number, default: 0 },
    scrollIntoView: { type: String, default: '' },
    scrollWithAnimation: { type: Boolean, default: false },
    upperThreshold: { type: Number, default: 50 },
    lowerThreshold: { type: Number, default: 50 }
  },
  data () {
    return {
      mutationObserver: null,
      resizeObserver: null,
      refreshQueued: false,
      atUpper: { top: false, left: false },
      atLower: { bottom: false, right: false },
      lastScrollTop: 0,
      lastScrollLeft: 0
    }
  },
  computed: {
    axisClass () {
      return {
        'analytics-scroll--x': this.scrollX,
        'analytics-scroll--y': this.scrollY
      }
    },
    passthroughListeners () {
      const listeners = Object.assign({}, this.$listeners)
      delete listeners.scroll
      delete listeners.scrolltoupper
      delete listeners.scrolltolower
      return listeners
    }
  },
  watch: {
    scrollTop () { this.syncPosition() },
    scrollLeft () { this.syncPosition() },
    scrollIntoView () { this.scrollTargetIntoView() },
    scrollX () { this.$nextTick(this.refresh) },
    scrollY () { this.$nextTick(this.refresh) }
  },
  mounted () {
    this.lastScrollTop = this.$refs.scroll.scrollTop
    this.lastScrollLeft = this.$refs.scroll.scrollLeft
    this.observeLayout()
    this.$nextTick(this.refresh)
  },
  updated () {
    this.queueRefresh()
  },
  beforeDestroy () {
    this.releaseObservers()
  },
  methods: {
    observeLayout () {
      const node = this.$refs.scroll
      if (typeof MutationObserver !== 'undefined') {
        this.mutationObserver = new MutationObserver(() => this.queueRefresh())
        this.mutationObserver.observe(node, { childList: true, subtree: true, attributes: true })
      }
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.queueRefresh())
        this.resizeObserver.observe(node)
      }
    },
    releaseObservers () {
      if (this.mutationObserver) this.mutationObserver.disconnect()
      if (this.resizeObserver) this.resizeObserver.disconnect()
      this.mutationObserver = null
      this.resizeObserver = null
    },
    queueRefresh () {
      if (this.refreshQueued) return
      this.refreshQueued = true
      this.$nextTick(() => {
        this.refreshQueued = false
        this.refresh()
      })
    },
    refresh () {
      this.syncPosition()
      this.scrollTargetIntoView()
    },
    syncPosition () {
      const node = this.$refs.scroll
      if (!node) return
      const top = Number(this.scrollTop)
      const left = Number(this.scrollLeft)
      const nextTop = Number.isFinite(top) ? top : 0
      const nextLeft = Number.isFinite(left) ? left : 0
      if (this.scrollWithAnimation && node.scrollTo) {
        node.scrollTo({ top: nextTop, left: nextLeft, behavior: 'smooth' })
      } else {
        if (this.scrollY) node.scrollTop = nextTop
        if (this.scrollX) node.scrollLeft = nextLeft
      }
    },
    scrollTargetIntoView () {
      const node = this.$refs.scroll
      const targetId = this.scrollIntoView
      if (!node || !targetId) return
      const target = Array.prototype.find.call(node.querySelectorAll('[id]'), (item) => item.id === targetId)
      if (!target) return
      const targetRect = target.getBoundingClientRect()
      const nodeRect = node.getBoundingClientRect()
      const top = node.scrollTop + targetRect.top - nodeRect.top
      const left = node.scrollLeft + targetRect.left - nodeRect.left
      if (this.scrollWithAnimation && node.scrollTo) {
        node.scrollTo({ top: this.scrollY ? top : node.scrollTop, left: this.scrollX ? left : node.scrollLeft, behavior: 'smooth' })
      } else {
        if (this.scrollY) node.scrollTop = top
        if (this.scrollX) node.scrollLeft = left
      }
    },
    handleScroll () {
      const node = this.$refs.scroll
      const detail = {
        scrollTop: node.scrollTop,
        scrollLeft: node.scrollLeft,
        scrollHeight: node.scrollHeight,
        scrollWidth: node.scrollWidth,
        deltaX: node.scrollLeft - this.lastScrollLeft,
        deltaY: node.scrollTop - this.lastScrollTop
      }
      this.lastScrollTop = node.scrollTop
      this.lastScrollLeft = node.scrollLeft
      this.$emit('scroll', detail)
      this.emitEdges(node)
    },
    emitEdges (node) {
      const upper = Math.max(0, Number(this.upperThreshold) || 0)
      const lower = Math.max(0, Number(this.lowerThreshold) || 0)
      if (this.scrollY) {
        this.emitEdge('top', node.scrollTop <= upper, 'upper')
        this.emitEdge('bottom', node.scrollTop >= node.scrollHeight - node.clientHeight - lower, 'lower')
      }
      if (this.scrollX) {
        this.emitEdge('left', node.scrollLeft <= upper, 'upper')
        this.emitEdge('right', node.scrollLeft >= node.scrollWidth - node.clientWidth - lower, 'lower')
      }
    },
    emitEdge (direction, active, edge) {
      const state = edge === 'upper' ? this.atUpper : this.atLower
      if (!active) {
        state[direction] = false
        return
      }
      if (state[direction]) return
      state[direction] = true
      this.$emit(edge === 'upper' ? 'scrolltoupper' : 'scrolltolower', { direction })
    }
  }
}
</script>

<style scoped>
.analytics-scroll {
  overflow: hidden;
}

.analytics-scroll--x {
  overflow-x: auto;
}

.analytics-scroll--y {
  overflow-y: auto;
}
</style>
