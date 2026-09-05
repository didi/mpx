<template>
  <div
    ref="viewport"
    class="analytics-scroll"
    :style="viewportStyle"
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
  data () {
    return { atUpper: false, atLower: false }
  },
  computed: {
    viewportStyle () {
      return {
        overflowX: this.scrollX ? 'auto' : 'hidden',
        overflowY: this.scrollY ? 'auto' : 'hidden'
      }
    }
  },
  watch: {
    scrollTop () { this.setScrollPosition() },
    scrollLeft () { this.setScrollPosition() },
    scrollIntoView () { this.scrollToView() }
  },
  mounted () {
    this.$nextTick(() => {
      this.setScrollPosition()
      this.scrollToView()
    })
  },
  methods: {
    setScrollPosition () {
      const viewport = this.$refs.viewport
      if (!viewport) return
      if (Number.isFinite(this.scrollTop)) viewport.scrollTop = this.scrollTop
      if (Number.isFinite(this.scrollLeft)) viewport.scrollLeft = this.scrollLeft
    },
    scrollToView () {
      const viewport = this.$refs.viewport
      const id = (this.scrollIntoView || '').replace(/^#/, '')
      if (!viewport || !id || typeof document === 'undefined') return
      const target = document.getElementById(id)
      if (!target || !viewport.contains(target)) return
      viewport.scrollTop = target.offsetTop
      viewport.scrollLeft = target.offsetLeft
    },
    detail (viewport) {
      return {
        scrollLeft: viewport.scrollLeft,
        scrollTop: viewport.scrollTop,
        scrollHeight: viewport.scrollHeight,
        scrollWidth: viewport.scrollWidth,
        clientHeight: viewport.clientHeight,
        clientWidth: viewport.clientWidth
      }
    },
    handleScroll (event) {
      const viewport = event.currentTarget
      const detail = this.detail(viewport)
      this.$emit('scroll', { detail })
      this.emitEdgeEvents(viewport, detail)
    },
    emitEdgeEvents (viewport, detail) {
      const upper = Math.max(0, Number(this.upperThreshold) || 0)
      const lower = Math.max(0, Number(this.lowerThreshold) || 0)
      const atUpper = detail.scrollTop <= upper || detail.scrollLeft <= upper
      const atLower = (viewport.scrollHeight - viewport.clientHeight - detail.scrollTop <= lower) ||
        (viewport.scrollWidth - viewport.clientWidth - detail.scrollLeft <= lower)

      if (atUpper && !this.atUpper) this.$emit('scrolltoupper', { detail })
      if (atLower && !this.atLower) this.$emit('scrolltolower', { detail })
      this.atUpper = atUpper
      this.atLower = atLower
    }
  }
}
</script>

<style scoped>
.analytics-scroll {
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}
</style>
