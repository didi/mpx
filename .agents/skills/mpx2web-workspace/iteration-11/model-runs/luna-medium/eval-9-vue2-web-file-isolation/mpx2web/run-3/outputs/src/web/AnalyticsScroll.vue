<template>
  <div ref="scroll" class="analytics-scroll" :style="scrollStyle" @scroll="handleNativeScroll">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'AnalyticsScroll',
  inheritAttrs: false,
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
    return { lastTop: 0, lastLeft: 0, atTop: false, atLeft: false, atBottom: false, atRight: false }
  },
  computed: {
    scrollStyle () {
      return { overflowX: this.scrollX ? 'auto' : 'hidden', overflowY: this.scrollY ? 'auto' : 'hidden' }
    }
  },
  mounted () { this.syncPosition(); this.syncIntoView() },
  updated () { this.syncIntoView() },
  watch: {
    scrollTop: 'syncPosition', scrollLeft: 'syncPosition', scrollIntoView: 'syncIntoView',
    scrollX: 'syncPosition', scrollY: 'syncPosition'
  },
  methods: {
    syncPosition () {
      const node = this.$refs.scroll
      if (!node) return
      if (this.scrollY) node.scrollTop = this.scrollTop
      if (this.scrollX) node.scrollLeft = this.scrollLeft
    },
    syncIntoView () {
      const node = this.$refs.scroll
      if (!node || !this.scrollIntoView) return
      this.$nextTick(() => {
        const target = Array.prototype.find.call(node.querySelectorAll('[id]'), (item) => item.id === this.scrollIntoView)
        if (!target) return
        const nodeRect = node.getBoundingClientRect(); const targetRect = target.getBoundingClientRect()
        if (this.scrollY) node.scrollTop += targetRect.top - nodeRect.top
        if (this.scrollX) node.scrollLeft += targetRect.left - nodeRect.left
      })
    },
    handleNativeScroll (event) {
      const node = event.currentTarget; const top = node.scrollTop; const left = node.scrollLeft
      const detail = { scrollTop: top, scrollLeft: left, scrollHeight: node.scrollHeight, scrollWidth: node.scrollWidth, deltaY: top - this.lastTop, deltaX: left - this.lastLeft }
      this.lastTop = top; this.lastLeft = left; this.$emit('scroll', detail)
      const nextTop = this.scrollY && top <= this.upperThreshold; const nextLeft = this.scrollX && left <= this.upperThreshold
      const nextBottom = this.scrollY && node.scrollHeight - node.clientHeight - top <= this.lowerThreshold
      const nextRight = this.scrollX && node.scrollWidth - node.clientWidth - left <= this.lowerThreshold
      if (nextTop && !this.atTop) this.$emit('scrolltoupper', detail)
      if (nextLeft && !this.atLeft && !nextTop) this.$emit('scrolltoupper', detail)
      if (nextBottom && !this.atBottom) this.$emit('scrolltolower', detail)
      if (nextRight && !this.atRight && !nextBottom) this.$emit('scrolltolower', detail)
      this.atTop = nextTop; this.atLeft = nextLeft; this.atBottom = nextBottom; this.atRight = nextRight
    }
  }
}
</script>
