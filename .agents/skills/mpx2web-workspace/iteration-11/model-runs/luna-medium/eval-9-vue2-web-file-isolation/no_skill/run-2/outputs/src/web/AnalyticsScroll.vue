<template>
  <div ref="viewport" class="analytics-scroll" :style="viewportStyle" @scroll="handleScroll">
    <div ref="content" class="analytics-scroll__content">
      <slot />
      <slot name="content" />
    </div>
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
  computed: {
    viewportStyle () {
      return { overflowX: this.scrollX ? 'auto' : 'hidden', overflowY: this.scrollY ? 'auto' : 'hidden', WebkitOverflowScrolling: 'touch' }
    }
  },
  mounted () { this.syncPosition(); this.scrollToTarget() },
  watch: {
    scrollTop () { this.syncPosition() },
    scrollLeft () { this.syncPosition() },
    scrollIntoView () { this.scrollToTarget() }
  },
  methods: {
    syncPosition () {
      const viewport = this.$refs.viewport
      if (!viewport) return
      if (Number.isFinite(this.scrollTop)) viewport.scrollTop = this.scrollTop
      if (Number.isFinite(this.scrollLeft)) viewport.scrollLeft = this.scrollLeft
    },
    scrollToTarget () {
      if (!this.scrollIntoView) return
      const target = document.getElementById(this.scrollIntoView)
      const viewport = this.$refs.viewport
      if (target && viewport && viewport.contains(target)) target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    },
    handleScroll (event) {
      const viewport = event.currentTarget
      const detail = { scrollTop: viewport.scrollTop, scrollLeft: viewport.scrollLeft, scrollHeight: viewport.scrollHeight, scrollWidth: viewport.scrollWidth, clientHeight: viewport.clientHeight, clientWidth: viewport.clientWidth }
      this.$emit('scroll', detail)
      if (viewport.scrollTop <= this.upperThreshold) this.$emit('scrolltoupper', detail)
      if (viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= this.lowerThreshold || viewport.scrollWidth - viewport.clientWidth - viewport.scrollLeft <= this.lowerThreshold) this.$emit('scrolltolower', detail)
    }
  }
}
</script>
