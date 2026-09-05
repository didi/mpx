<template>
  <div
    ref="scroll" 
    class="analytics-scroll"
    :class="{
      'analytics-scroll--x': scrollX,
      'analytics-scroll--y': scrollY
    }"
  >
    <slot />
  </div>
</template>

<script>
function numberOrZero (value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

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
    return {
      atUpper: false,
      atLower: false
    }
  },
  watch: {
    scrollTop (value) {
      this.setScrollPosition('top', value)
    },
    scrollLeft (value) {
      this.setScrollPosition('left', value)
    },
    scrollIntoView () {
      this.scrollToView()
    }
  },
  mounted () {
    this.$refs.scroll.addEventListener('scroll', this.handleScroll, { passive: true })
    this.setScrollPosition('top', this.scrollTop)
    this.setScrollPosition('left', this.scrollLeft)
    this.scrollToView()
  },
  beforeDestroy () {
    if (this.$refs.scroll) {
      this.$refs.scroll.removeEventListener('scroll', this.handleScroll)
    }
  },
  methods: {
    setScrollPosition (axis, value) {
      const element = this.$refs.scroll
      if (!element) return
      const position = numberOrZero(value)
      if (axis === 'top' && element.scrollTop !== position) element.scrollTop = position
      if (axis === 'left' && element.scrollLeft !== position) element.scrollLeft = position
    },
    scrollToView () {
      const id = this.scrollIntoView
      if (!id) return
      this.$nextTick(() => {
        const element = this.$refs.scroll
        if (!element) return
        const target = Array.prototype.find.call(
          element.querySelectorAll('[id]'),
          (node) => node.id === id
        )
        if (target && typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        }
      })
    },
    handleScroll () {
      const element = this.$refs.scroll
      const detail = {
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        scrollWidth: element.scrollWidth,
        clientHeight: element.clientHeight,
        clientWidth: element.clientWidth
      }
      this.$emit('scroll', detail)

      const upper = this.isAtUpper(element)
      const lower = this.isAtLower(element)
      if (upper && !this.atUpper) this.$emit('scrolltoupper', detail)
      if (lower && !this.atLower) this.$emit('scrolltolower', detail)
      this.atUpper = upper
      this.atLower = lower
    },
    isAtUpper (element) {
      const threshold = Math.max(0, numberOrZero(this.upperThreshold))
      return (this.scrollY && element.scrollTop <= threshold) ||
        (this.scrollX && element.scrollLeft <= threshold)
    },
    isAtLower (element) {
      const threshold = Math.max(0, numberOrZero(this.lowerThreshold))
      const vertical = element.scrollHeight - element.clientHeight - element.scrollTop <= threshold
      const horizontal = element.scrollWidth - element.clientWidth - element.scrollLeft <= threshold
      return (this.scrollY && vertical) || (this.scrollX && horizontal)
    }
  }
}
</script>

<style scoped>
.analytics-scroll {
  overflow: hidden;
}

.analytics-scroll--x {
  overflow-x: auto;
}

.analytics-scroll--y {
  overflow-y: auto;
}
</style>
