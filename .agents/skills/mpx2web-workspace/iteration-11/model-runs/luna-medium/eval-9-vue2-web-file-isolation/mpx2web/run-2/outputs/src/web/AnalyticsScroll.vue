<template>
  <div ref="container" class="analytics-scroll" @scroll="onScroll"><slot /></div>
</template>

<script>
export default {
  name: 'AnalyticsScroll',
  inheritAttrs: false,
  props: {
    scrollX: { type: Boolean, default: false }, scrollY: { type: Boolean, default: false },
    scrollTop: { type: Number, default: 0 }, scrollLeft: { type: Number, default: 0 },
    scrollIntoView: { type: String, default: '' }, upperThreshold: { type: Number, default: 50 },
    lowerThreshold: { type: Number, default: 50 }
  },
  data () { return { atUpper: false, atLower: false, mutationObserver: null, resizeObserver: null } },
  computed: {
    overflowStyle () { return { overflowX: this.scrollX ? 'auto' : 'hidden', overflowY: this.scrollY ? 'auto' : 'hidden' } }
  },
  mounted () {
    const el = this.$refs.container
    Object.assign(el.style, this.overflowStyle)
    this.syncPosition()
    this.scrollToTarget()
    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => this.$nextTick(() => this.scrollToTarget()))
      this.mutationObserver.observe(el, { childList: true, subtree: true })
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.$nextTick(() => this.scrollToTarget()))
      this.resizeObserver.observe(el)
    }
  },
  watch: {
    scrollX: 'applyOverflow', scrollY: 'applyOverflow', scrollTop: 'syncPosition', scrollLeft: 'syncPosition',
    scrollIntoView () { this.$nextTick(this.scrollToTarget) }
  },
  methods: {
    applyOverflow () { if (this.$refs.container) Object.assign(this.$refs.container.style, this.overflowStyle) },
    syncPosition () {
      const el = this.$refs.container
      if (!el) return
      if (this.scrollY) el.scrollTop = Math.max(0, this.scrollTop)
      if (this.scrollX) el.scrollLeft = Math.max(0, this.scrollLeft)
    },
    scrollToTarget () {
      const el = this.$refs.container
      if (!el || !this.scrollIntoView) return
      const target = el.querySelector('#' + (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(this.scrollIntoView) : this.scrollIntoView.replace(/([ #;?%&,.+*~\':!^$[\]()=>|/@])/g, '\\$1')))
      if (!target) return
      const box = el.getBoundingClientRect(); const targetBox = target.getBoundingClientRect()
      if (this.scrollY) el.scrollTop += targetBox.top - box.top
      if (this.scrollX) el.scrollLeft += targetBox.left - box.left
    },
    onScroll (event) {
      const el = event.currentTarget
      const detail = { scrollTop: el.scrollTop, scrollLeft: el.scrollLeft, scrollHeight: el.scrollHeight, scrollWidth: el.scrollWidth, deltaX: el.scrollLeft - (this._lastLeft || 0), deltaY: el.scrollTop - (this._lastTop || 0) }
      this._lastLeft = detail.scrollLeft; this._lastTop = detail.scrollTop
      this.$emit('scroll', { type: event.type, target: event.target, detail })
      const upper = (this.scrollY && detail.scrollTop <= this.upperThreshold) || (this.scrollX && detail.scrollLeft <= this.upperThreshold)
      const lower = (this.scrollY && detail.scrollTop + el.clientHeight >= detail.scrollHeight - this.lowerThreshold) || (this.scrollX && detail.scrollLeft + el.clientWidth >= detail.scrollWidth - this.lowerThreshold)
      if (upper && !this.atUpper) this.$emit('scrolltoupper', { detail })
      if (lower && !this.atLower) this.$emit('scrolltolower', { detail })
      this.atUpper = upper; this.atLower = lower
    }
  },
  beforeDestroy () {
    if (this.mutationObserver) this.mutationObserver.disconnect()
    if (this.resizeObserver) this.resizeObserver.disconnect()
    this.mutationObserver = null; this.resizeObserver = null
  }
}
</script>

<style scoped>
.analytics-scroll { min-width: 0; min-height: 0; }
</style>
