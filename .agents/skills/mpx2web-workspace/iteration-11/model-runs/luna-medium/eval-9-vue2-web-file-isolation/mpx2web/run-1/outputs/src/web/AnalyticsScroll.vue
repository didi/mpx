<template>
  <div
    ref="viewport"
    class="analytics-scroll"
    :class="{ 'analytics-scroll--x': scrollX, 'analytics-scroll--y': scrollY }"
    @scroll="handleNativeScroll"
  >
    <div ref="content" class="analytics-scroll__content"><slot /></div>
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
    lowerThreshold: { type: Number, default: 50 },
    scrollWithAnimation: { type: Boolean, default: false }
  },
  data () {
    return { lastTop: 0, lastLeft: 0, atTop: true, atLeft: true, atBottom: false, atRight: false, resizeObserver: null, mutationObserver: null }
  },
  mounted () {
    this.syncPosition()
    this.refreshObservers()
    this.$nextTick(this.scrollToTarget)
  },
  beforeDestroy () {
    if (this.resizeObserver) this.resizeObserver.disconnect()
    if (this.mutationObserver) this.mutationObserver.disconnect()
  },
  watch: {
    scrollTop () { this.syncPosition() },
    scrollLeft () { this.syncPosition() },
    scrollIntoView () { this.$nextTick(this.scrollToTarget) },
    scrollX () { this.$nextTick(this.refreshObservers) },
    scrollY () { this.$nextTick(this.refreshObservers) }
  },
  methods: {
    refreshObservers () {
      const viewport = this.$refs.viewport
      const content = this.$refs.content
      if (!viewport || !content) return
      if (this.resizeObserver) this.resizeObserver.disconnect()
      if (this.mutationObserver) this.mutationObserver.disconnect()
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.$nextTick(this.scrollToTarget))
        this.resizeObserver.observe(viewport)
        this.resizeObserver.observe(content)
      }
      if (typeof MutationObserver !== 'undefined') {
        this.mutationObserver = new MutationObserver(() => this.$nextTick(this.scrollToTarget))
        this.mutationObserver.observe(content, { childList: true, subtree: true, attributes: true })
      }
    },
    syncPosition () {
      const node = this.$refs.viewport
      if (!node) return
      const behavior = this.scrollWithAnimation ? 'smooth' : 'auto'
      if (node.scrollTo) node.scrollTo({ top: this.scrollTop, left: this.scrollLeft, behavior })
      else { node.scrollTop = this.scrollTop; node.scrollLeft = this.scrollLeft }
    },
    scroll (options = {}) {
      const node = this.$refs.viewport
      if (!node) return
      const top = options.top === undefined ? node.scrollTop : options.top
      const left = options.left === undefined ? node.scrollLeft : options.left
      const behavior = options.behavior || (this.scrollWithAnimation ? 'smooth' : 'auto')
      if (node.scrollTo) node.scrollTo({ top, left, behavior })
      else { node.scrollTop = top; node.scrollLeft = left }
    },
    scrollToTarget () {
      if (!this.scrollIntoView) return
      const node = this.$refs.viewport
      const target = node && node.querySelector(`#${this.escapeId(this.scrollIntoView)}`)
      if (target) target.scrollIntoView({ behavior: this.scrollWithAnimation ? 'smooth' : 'auto', block: 'nearest', inline: 'nearest' })
    },
    escapeId (id) { return String(id).replace(/([\\.#:[\],])/g, '\\$1') },
    handleNativeScroll (event) {
      const node = event.currentTarget
      const top = node.scrollTop
      const left = node.scrollLeft
      const maxTop = Math.max(0, node.scrollHeight - node.clientHeight)
      const maxLeft = Math.max(0, node.scrollWidth - node.clientWidth)
      const detail = { scrollTop: top, scrollLeft: left, scrollHeight: node.scrollHeight, scrollWidth: node.scrollWidth, deltaX: left - this.lastLeft, deltaY: top - this.lastTop }
      this.lastTop = top; this.lastLeft = left
      this.$emit('scroll', { detail })
      const topEdge = this.scrollY && top <= this.upperThreshold
      const leftEdge = this.scrollX && left <= this.upperThreshold
      const bottomEdge = this.scrollY && maxTop - top <= this.lowerThreshold
      const rightEdge = this.scrollX && maxLeft - left <= this.lowerThreshold
      if (topEdge && !this.atTop) this.$emit('scrolltoupper', { detail: { ...detail, direction: 'top' } })
      if (leftEdge && !this.atLeft) this.$emit('scrolltoupper', { detail: { ...detail, direction: 'left' } })
      if (bottomEdge && !this.atBottom) this.$emit('scrolltolower', { detail: { ...detail, direction: 'bottom' } })
      if (rightEdge && !this.atRight) this.$emit('scrolltolower', { detail: { ...detail, direction: 'right' } })
      this.atTop = topEdge; this.atLeft = leftEdge; this.atBottom = bottomEdge; this.atRight = rightEdge
    }
  }
}
</script>

<style scoped>
.analytics-scroll { width: 100%; max-height: 100%; }
.analytics-scroll--x { overflow-x: auto; }
.analytics-scroll--y { overflow-y: auto; }
.analytics-scroll__content { min-width: max-content; }
</style>
