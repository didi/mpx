<template>
  <div ref="viewport" class="analytics-scroll" :style="viewportStyle" @scroll="handleScroll">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'AnalyticsScroll',
  props: {
    scrollX: { type: Boolean, default: false }, scrollY: { type: Boolean, default: true },
    scrollTop: { type: Number, default: 0 }, scrollLeft: { type: Number, default: 0 },
    scrollIntoView: { type: String, default: '' },
    upperThreshold: { type: Number, default: 50 }, lowerThreshold: { type: Number, default: 50 }
  },
  data () { return { upperSent: false, lowerSent: false } },
  computed: {
    viewportStyle () { return { overflowX: this.scrollX ? 'auto' : 'hidden', overflowY: this.scrollY ? 'auto' : 'hidden' } }
  },
  watch: {
    scrollTop (value) { this.setScroll('top', value) }, scrollLeft (value) { this.setScroll('left', value) },
    scrollIntoView (value) { if (value) this.scrollToView(value) }
  },
  mounted () {
    this.$nextTick(() => { this.setScroll('top', this.scrollTop); this.setScroll('left', this.scrollLeft); if (this.scrollIntoView) this.scrollToView(this.scrollIntoView) })
  },
  methods: {
    setScroll (axis, value) {
      const viewport = this.$refs.viewport
      if (viewport && typeof value === 'number') viewport[axis === 'top' ? 'scrollTop' : 'scrollLeft'] = value
    },
    scrollTo (options) {
      if (typeof options === 'number') options = { top: options }
      options = options || {}
      if (typeof options.top === 'number') this.setScroll('top', options.top)
      if (typeof options.left === 'number') this.setScroll('left', options.left)
    },
    scrollToView (id) {
      const viewport = this.$refs.viewport
      if (!viewport || !id) return
      const target = viewport.querySelector('[id="' + String(id).replace(/"/g, '\\"') + '"]')
      if (target && target.scrollIntoView) target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    },
    detail (event) {
      const viewport = event.currentTarget
      return { scrollTop: viewport.scrollTop, scrollLeft: viewport.scrollLeft, scrollHeight: viewport.scrollHeight, scrollWidth: viewport.scrollWidth, clientHeight: viewport.clientHeight, clientWidth: viewport.clientWidth }
    },
    handleScroll (event) {
      const detail = this.detail(event)
      this.$emit('scroll', { detail })
      const top = detail.scrollTop <= this.upperThreshold
      const bottom = detail.scrollTop + detail.clientHeight >= detail.scrollHeight - this.lowerThreshold
      if (top && !this.upperSent) { this.upperSent = true; this.$emit('scrolltoupper', { detail }) } else if (!top) this.upperSent = false
      if (bottom && !this.lowerSent) { this.lowerSent = true; this.$emit('scrolltolower', { detail }) } else if (!bottom) this.lowerSent = false
    }
  }
}
</script>
