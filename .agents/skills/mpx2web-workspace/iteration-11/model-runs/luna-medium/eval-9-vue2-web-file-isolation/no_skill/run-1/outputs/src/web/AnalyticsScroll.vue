<template>
  <div
    ref="viewport"
    class="analytics-scroll"
    :class="{ 'analytics-scroll--x': scrollX, 'analytics-scroll--y': scrollY }"
    @scroll="handleScroll"
  >
    <div ref="content" class="analytics-scroll__content"><slot /></div>
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
  mounted () {
    this.applyPosition()
    this.scrollToTarget()
  },
  watch: {
    scrollTop: 'applyPosition',
    scrollLeft: 'applyPosition',
    scrollIntoView: 'scrollToTarget'
  },
  methods: {
    applyPosition () {
      const node = this.$refs.viewport
      if (!node) return
      if (this.scrollY) node.scrollTop = this.scrollTop
      if (this.scrollX) node.scrollLeft = this.scrollLeft
    },
    scrollToTarget () {
      if (!this.scrollIntoView || !this.$refs.viewport) return
      const nodes = this.$el.querySelectorAll('[id]')
      const target = Array.prototype.find.call(nodes, node => node.id === this.scrollIntoView)
      if (target) target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    },
    handleScroll (event) {
      const node = event.currentTarget
      const detail = {
        scrollTop: node.scrollTop,
        scrollLeft: node.scrollLeft,
        scrollHeight: node.scrollHeight,
        scrollWidth: node.scrollWidth,
        clientHeight: node.clientHeight,
        clientWidth: node.clientWidth
      }
      this.$emit('scroll', detail)
      if (node.scrollTop <= this.upperThreshold || node.scrollLeft <= this.upperThreshold) this.$emit('scrolltoupper', detail)
      if (node.scrollTop + node.clientHeight >= node.scrollHeight - this.lowerThreshold || node.scrollLeft + node.clientWidth >= node.scrollWidth - this.lowerThreshold) this.$emit('scrolltolower', detail)
    }
  }
}
</script>

<style scoped>
.analytics-scroll { overflow: hidden; }
.analytics-scroll--x { overflow-x: auto; }
.analytics-scroll--y { overflow-y: auto; }
.analytics-scroll__content { min-width: max-content; }
</style>
