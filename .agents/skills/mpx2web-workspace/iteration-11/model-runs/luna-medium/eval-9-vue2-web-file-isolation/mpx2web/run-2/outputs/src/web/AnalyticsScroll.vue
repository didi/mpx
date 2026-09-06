<template>
  <div ref="viewport" class="analytics-scroll" :style="viewportStyle" v-on="passthroughListeners" @scroll="handleScroll">
    <div ref="content" class="analytics-scroll__content"><slot /><slot name="content" /></div>
  </div>
</template>

<script>
export default {
  name: 'AnalyticsScroll', inheritAttrs: false,
  props: {
    scrollX: Boolean, scrollY: Boolean,
    scrollTop: { type: Number, default: 0 }, scrollLeft: { type: Number, default: 0 },
    scrollIntoView: { type: String, default: '' }, upperThreshold: { type: Number, default: 50 }, lowerThreshold: { type: Number, default: 50 }, scrollWithAnimation: Boolean
  },
  data () { return { resizeObserver: null, mutationObserver: null, lastBoundary: { top: false, left: false, bottom: false, right: false } } },
  computed: {
    passthroughListeners () { const listeners = Object.assign({}, this.$listeners); delete listeners.scroll; delete listeners.scrolltoupper; delete listeners.scrolltolower; return listeners },
    viewportStyle () { return { overflowX: this.scrollX ? 'auto' : 'hidden', overflowY: this.scrollY ? 'auto' : 'hidden' } }
  },
  mounted () {
    this.applyPosition(); this.scrollIntoViewTarget()
    const refresh = () => this.refresh()
    if (typeof ResizeObserver !== 'undefined') { this.resizeObserver = new ResizeObserver(refresh); this.resizeObserver.observe(this.$refs.viewport); this.resizeObserver.observe(this.$refs.content) }
    if (typeof MutationObserver !== 'undefined') { this.mutationObserver = new MutationObserver(refresh); this.mutationObserver.observe(this.$refs.content, { childList: true, subtree: true, attributes: true }) }
  },
  beforeDestroy () { if (this.resizeObserver) this.resizeObserver.disconnect(); if (this.mutationObserver) this.mutationObserver.disconnect(); this.resizeObserver = null; this.mutationObserver = null },
  watch: { scrollTop: 'applyPosition', scrollLeft: 'applyPosition', scrollIntoView: 'scrollIntoViewTarget', scrollX: 'applyPosition', scrollY: 'applyPosition' },
  methods: {
    refresh () { this.$nextTick(() => { if (this.$refs.viewport) this.$refs.viewport.dispatchEvent(new Event('scroll')) }) },
    applyPosition () { this.$nextTick(() => { const el = this.$refs.viewport; if (!el) return; if (this.scrollY) el.scrollTop = Math.max(0, Number(this.scrollTop) || 0); if (this.scrollX) el.scrollLeft = Math.max(0, Number(this.scrollLeft) || 0) }) },
    scrollIntoViewTarget () { this.$nextTick(() => { if (!this.scrollIntoView || !this.$refs.content) return; const target = this.$refs.content.querySelector('[id="' + String(this.scrollIntoView).replace(/"/g, '\\"') + '"]'); if (target) target.scrollIntoView({ behavior: this.scrollWithAnimation ? 'smooth' : 'auto', block: 'nearest', inline: 'nearest' }) }) },
    scroll (options = {}) { const el = this.$refs.viewport; if (el) el.scrollTo({ left: Number(options.scrollLeft) || 0, top: Number(options.scrollTop) || 0, behavior: options.animated ? 'smooth' : 'auto' }) },
    handleScroll (event) {
      const el = event.currentTarget; const detail = { scrollTop: el.scrollTop, scrollLeft: el.scrollLeft, scrollHeight: el.scrollHeight, scrollWidth: el.scrollWidth, deltaX: el.scrollLeft - (this._lastLeft || 0), deltaY: el.scrollTop - (this._lastTop || 0) }
      this._lastLeft = detail.scrollLeft; this._lastTop = detail.scrollTop; this.$emit('scroll', { detail })
      this.emitBoundary('scrolltoupper', 'top', detail.scrollTop <= this.upperThreshold); this.emitBoundary('scrolltoupper', 'left', detail.scrollLeft <= this.upperThreshold)
      this.emitBoundary('scrolltolower', 'bottom', el.scrollHeight - el.clientHeight - detail.scrollTop <= this.lowerThreshold); this.emitBoundary('scrolltolower', 'right', el.scrollWidth - el.clientWidth - detail.scrollLeft <= this.lowerThreshold)
    },
    emitBoundary (eventName, axis, active) { if (active && !this.lastBoundary[axis]) this.$emit(eventName, { detail: { ...this.lastBoundary, [axis]: true } }); this.lastBoundary[axis] = active }
  }
}
</script>

<style>
.analytics-scroll { position: relative; width: 100%; height: 100%; }
.analytics-scroll__content { min-width: 100%; }
</style>
