<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :class="{ 'analytics-scroll--x': scrollX, 'analytics-scroll--y': scrollY }"
    @scroll="onScroll"
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
  data () {
    return { atUpper: false, atLower: false }
  },
  mounted () {
    this.applyPosition()
    this.applyScrollIntoView()
  },
  watch: {
    scrollTop: 'applyPosition',
    scrollLeft: 'applyPosition',
    scrollIntoView: 'applyScrollIntoView'
  },
  methods: {
    applyPosition () {
      const el = this.$refs.scroller
      if (!el) return
      if (this.scrollY && Math.abs(el.scrollTop - this.scrollTop) > 0.5) el.scrollTop = this.scrollTop
      if (this.scrollX && Math.abs(el.scrollLeft - this.scrollLeft) > 0.5) el.scrollLeft = this.scrollLeft
    },
    applyScrollIntoView () {
      if (!this.scrollIntoView) return
      const root = this.$refs.scroller
      const target = root && root.querySelector
        ? root.querySelector('#' + String(this.scrollIntoView).replace(/([\\.#:[\\],])/g, '\\$1'))
        : null
      if (target && target.scrollIntoView) target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    },
    detail () {
      const el = this.$refs.scroller
      return el ? {
        scrollTop: el.scrollTop,
        scrollLeft: el.scrollLeft,
        scrollHeight: el.scrollHeight,
        scrollWidth: el.scrollWidth,
        clientHeight: el.clientHeight,
        clientWidth: el.clientWidth
      } : {}
    },
    onScroll () {
      const el = this.$refs.scroller
      if (!el) return
      const detail = this.detail()
      this.$emit('scroll', detail)
      const atUpper = (this.scrollY && el.scrollTop <= this.upperThreshold) || (this.scrollX && el.scrollLeft <= this.upperThreshold)
      const atLower = (this.scrollY && el.scrollHeight - el.clientHeight - el.scrollTop <= this.lowerThreshold) || (this.scrollX && el.scrollWidth - el.clientWidth - el.scrollLeft <= this.lowerThreshold)
      if (atUpper && !this.atUpper) this.$emit('scrolltoupper', detail)
      if (atLower && !this.atLower) this.$emit('scrolltolower', detail)
      this.atUpper = atUpper
      this.atLower = atLower
    }
  }
}
</script>

<style scoped>
.analytics-scroll { overflow: hidden; }
.analytics-scroll--x { overflow-x: auto; }
.analytics-scroll--y { overflow-y: auto; }
</style>
