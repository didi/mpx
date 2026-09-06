<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :style="scrollStyle"
    @scroll="onScroll"
  >
    <slot />
  </div>
</template>

<script>
export default {
  name: 'AnalyticsScroll',
  props: {
    scrollX: Boolean,
    scrollY: Boolean,
    scrollTop: { type: Number, default: 0 },
    scrollLeft: { type: Number, default: 0 },
    scrollIntoView: { type: String, default: '' },
    upperThreshold: { type: Number, default: 50 },
    lowerThreshold: { type: Number, default: 50 }
  },
  data () {
    return { lastTop: 0, lastLeft: 0, wasAtTop: true, wasAtBottom: false }
  },
  computed: {
    scrollStyle () {
      return {
        overflowX: this.scrollX ? 'auto' : 'hidden',
        overflowY: this.scrollY ? 'auto' : 'hidden',
        WebkitOverflowScrolling: 'touch'
      }
    }
  },
  mounted () {
    this.applyPosition()
    this.scrollToTarget()
  },
  watch: {
    scrollTop: 'applyPosition',
    scrollLeft: 'applyPosition',
    scrollIntoView () { this.$nextTick(this.scrollToTarget) }
  },
  methods: {
    applyPosition () {
      const el = this.$refs.scroller
      if (!el) return
      if (this.scrollY) el.scrollTop = this.scrollTop
      if (this.scrollX) el.scrollLeft = this.scrollLeft
    },
    scrollToTarget () {
      const el = this.$refs.scroller
      if (!el || !this.scrollIntoView) return
      const target = Array.from(el.querySelectorAll('[id], [data-key]')).find(node =>
        node.id === this.scrollIntoView || node.dataset.key === this.scrollIntoView
      )
      if (!target) return
      if (this.scrollY) el.scrollTop = Math.max(0, target.offsetTop)
      if (this.scrollX) el.scrollLeft = Math.max(0, target.offsetLeft)
    },
    onScroll (event) {
      const el = event.currentTarget
      const detail = {
        scrollTop: el.scrollTop,
        scrollLeft: el.scrollLeft,
        scrollHeight: el.scrollHeight,
        scrollWidth: el.scrollWidth,
        deltaY: el.scrollTop - this.lastTop,
        deltaX: el.scrollLeft - this.lastLeft
      }
      this.lastTop = el.scrollTop
      this.lastLeft = el.scrollLeft
      const atTop = el.scrollTop <= this.upperThreshold
      const atBottom = el.scrollHeight - el.clientHeight - el.scrollTop <= this.lowerThreshold
      this.$emit('scroll', detail)
      if (atTop && !this.wasAtTop) this.$emit('scrolltoupper', detail)
      if (atBottom && !this.wasAtBottom) this.$emit('scrolltolower', detail)
      this.wasAtTop = atTop
      this.wasAtBottom = atBottom
    }
  }
}
</script>
