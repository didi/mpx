<template>
  <div
    ref="viewport"
    class="analytics-scroll"
    :class="{ 'analytics-scroll--x': scrollX, 'analytics-scroll--y': scrollY }"
    @scroll="handleScroll"
  >
    <div class="analytics-scroll__content"><slot /></div>
  </div>
</template>

<script>
export default {
  name: 'AnalyticsScroll',
  props: {
    scrollX: { type: Boolean, default: false },
    scrollY: { type: Boolean, default: false },
    scrollTop: { type: Number, default: 0 },
    scrollLeft: { type: Number, default: 0 },
    scrollIntoView: { type: String, default: '' },
    upperThreshold: { type: Number, default: 50 },
    lowerThreshold: { type: Number, default: 50 }
  },
  data () { return { listenerAttached: false } },
  mounted () {
    this.applyPosition()
    this.scrollToTarget()
    this.listenerAttached = true
  },
  beforeDestroy () {
    this.listenerAttached = false
  },
  watch: {
    scrollTop () { this.applyPosition() },
    scrollLeft () { this.applyPosition() },
    scrollIntoView () { this.scrollToTarget() }
  },
  methods: {
    applyPosition () {
      const viewport = this.$refs.viewport
      if (!viewport) return
      if (typeof this.scrollTop === 'number') viewport.scrollTop = this.scrollTop
      if (typeof this.scrollLeft === 'number') viewport.scrollLeft = this.scrollLeft
    },
    scrollToTarget () {
      if (!this.scrollIntoView || !this.$refs.viewport) return
      this.$nextTick(() => {
        const target = this.$refs.viewport.querySelector('#' + this.scrollIntoView)
        if (target) target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      })
    },
    handleScroll (event) {
      if (!this.listenerAttached) return
      const viewport = event.currentTarget
      const detail = {
        scrollTop: viewport.scrollTop,
        scrollLeft: viewport.scrollLeft,
        scrollHeight: viewport.scrollHeight,
        scrollWidth: viewport.scrollWidth
      }
      this.$emit('scroll', detail)
      if ((this.scrollY && viewport.scrollTop <= this.upperThreshold) ||
          (this.scrollX && viewport.scrollLeft <= this.upperThreshold)) {
        this.$emit('scrolltoupper', detail)
      }
      if ((this.scrollY && viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= this.lowerThreshold) ||
          (this.scrollX && viewport.scrollWidth - viewport.clientWidth - viewport.scrollLeft <= this.lowerThreshold)) {
        this.$emit('scrolltolower', detail)
      }
    }
  }
}
</script>

<style scoped>
.analytics-scroll { width: 100%; height: 100%; }
.analytics-scroll--x { overflow-x: auto; }
.analytics-scroll--y { overflow-y: auto; }
.analytics-scroll__content { min-width: max-content; }
</style>
