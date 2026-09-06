<template>
  <div
    ref="viewport"
    class="analytics-scroll"
    :style="viewportStyle"
    v-bind="$attrs"
    v-on="passthroughListeners"
    @scroll="onScroll"
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
    upperThreshold: { type: Number, default: 50 },
    lowerThreshold: { type: Number, default: 50 }
  },
  data () {
    return { lastTop: 0, lastLeft: 0, edgeState: {}, mutationObserver: null, resizeObserver: null }
  },
  computed: {
    viewportStyle () {
      return {
        overflowX: this.scrollX ? 'auto' : 'hidden',
        overflowY: this.scrollY ? 'auto' : 'hidden'
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
    scrollTop () { this.applyPosition() },
    scrollLeft () { this.applyPosition() },
    scrollIntoView () { this.$nextTick(this.applyIntoView) },
    scrollX () { this.resetEdges() },
    scrollY () { this.resetEdges() }
  },
  mounted () {
    this.applyPosition()
    this.$nextTick(this.applyIntoView)
    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => this.$nextTick(this.refresh))
      this.mutationObserver.observe(this.$refs.viewport, { childList: true, subtree: true })
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.refresh())
      this.resizeObserver.observe(this.$refs.viewport)
    }
  },
  methods: {
    applyPosition () {
      const node = this.$refs.viewport
      if (!node) return
      if (this.scrollY) node.scrollTop = Number(this.scrollTop) || 0
      if (this.scrollX) node.scrollLeft = Number(this.scrollLeft) || 0
    },
    applyIntoView () {
      const node = this.$refs.viewport
      if (!node || !this.scrollIntoView) return
      const target = Array.from(node.querySelectorAll('[id]')).find((item) => item.id === this.scrollIntoView)
      if (!target) return
      const viewportRect = node.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      if (this.scrollY) node.scrollTop += targetRect.top - viewportRect.top
      if (this.scrollX) node.scrollLeft += targetRect.left - viewportRect.left
    },
    scroll (options) {
      const next = options || {}
      const node = this.$refs.viewport
      if (!node) return
      if (next.scrollTop != null && this.scrollY) node.scrollTop = Number(next.scrollTop) || 0
      if (next.scrollLeft != null && this.scrollX) node.scrollLeft = Number(next.scrollLeft) || 0
    },
    scrollIntoViewById (id) {
      this.$emit('update:scrollIntoView', id)
      this.$nextTick(() => this.applyIntoView())
    },
    refresh () {
      this.applyPosition()
      this.applyIntoView()
    },
    resetEdges () { this.edgeState = {} },
    onScroll (event) {
      const node = event.currentTarget
      const top = node.scrollTop
      const left = node.scrollLeft
      const detail = {
        scrollTop: top,
        scrollLeft: left,
        scrollHeight: node.scrollHeight,
        scrollWidth: node.scrollWidth,
        deltaX: left - this.lastLeft,
        deltaY: top - this.lastTop
      }
      this.lastTop = top
      this.lastLeft = left
      this.$emit('scroll', { detail })
      this.emitEdge('top', this.scrollY && top <= this.upperThreshold, detail)
      this.emitEdge('left', this.scrollX && left <= this.upperThreshold, detail)
      this.emitEdge('bottom', this.scrollY && node.scrollHeight - node.clientHeight - top <= this.lowerThreshold, detail)
      this.emitEdge('right', this.scrollX && node.scrollWidth - node.clientWidth - left <= this.lowerThreshold, detail)
    },
    emitEdge (edge, active, detail) {
      if (!active) { this.$set(this.edgeState, edge, false); return }
      if (this.edgeState[edge]) return
      this.$set(this.edgeState, edge, true)
      if (edge === 'top' || edge === 'left') this.$emit('scrolltoupper', { detail })
      else this.$emit('scrolltolower', { detail })
    }
  },
  beforeDestroy () {
    if (this.mutationObserver) this.mutationObserver.disconnect()
    if (this.resizeObserver) this.resizeObserver.disconnect()
    this.mutationObserver = null
    this.resizeObserver = null
  }
}
</script>
