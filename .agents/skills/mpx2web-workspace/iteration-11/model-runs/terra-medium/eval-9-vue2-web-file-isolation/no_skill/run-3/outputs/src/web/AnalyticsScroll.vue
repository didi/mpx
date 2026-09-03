<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :class="{ 'analytics-scroll--x': scrollX, 'analytics-scroll--y': scrollY }"
    @scroll="handleScroll"
  >
    <slot />
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
  data: function () {
    return { atUpper: false, atLower: false }
  },
  watch: {
    scrollTop: 'applyPosition',
    scrollLeft: 'applyPosition',
    scrollIntoView: 'applyScrollIntoView'
  },
  mounted: function () {
    this.applyPosition()
    this.applyScrollIntoView()
  },
  methods: {
    applyPosition: function () {
      const node = this.$refs.scroller
      if (!node) return
      if (this.scrollY && Number.isFinite(this.scrollTop)) node.scrollTop = this.scrollTop
      if (this.scrollX && Number.isFinite(this.scrollLeft)) node.scrollLeft = this.scrollLeft
    },
    applyScrollIntoView: function () {
      const id = this.scrollIntoView
      if (!id) return
      this.$nextTick(() => {
        const node = this.$refs.scroller
        const target = node && node.querySelector('#' + this.escapeId(id))
        if (target) target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      })
    },
    escapeId: function (id) {
      if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(String(id))
      return String(id).replace(/[^a-zA-Z0-9_-]/g, '\\$&')
    },
    handleScroll: function (event) {
      const node = event.target
      const detail = { scrollTop: node.scrollTop, scrollLeft: node.scrollLeft }
      this.$emit('scroll', detail)
      const upper = node.scrollTop <= this.upperThreshold && node.scrollLeft <= this.upperThreshold
      const lower = (node.scrollHeight - node.clientHeight - node.scrollTop <= this.lowerThreshold) &&
        (node.scrollWidth - node.clientWidth - node.scrollLeft <= this.lowerThreshold)
      if (upper && !this.atUpper) this.$emit('scrolltoupper', detail)
      if (lower && !this.atLower) this.$emit('scrolltolower', detail)
      this.atUpper = upper
      this.atLower = lower
    }
  }
}
</script>

<style scoped>
.analytics-scroll { overflow: hidden; }
.analytics-scroll--x { overflow-x: auto; }
.analytics-scroll--y { overflow-y: auto; }
</style>
