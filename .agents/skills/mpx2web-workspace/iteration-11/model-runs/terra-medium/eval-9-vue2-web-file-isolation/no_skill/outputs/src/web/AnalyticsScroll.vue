<template>
  <div
    ref="viewport"
    class="analytics-scroll"
    :style="viewportStyle"
    @scroll="handleScroll"
  >
    <slot></slot>
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
    return {
      upperActive: false,
      lowerActive: false,
      previousTop: 0,
      previousLeft: 0
    }
  },
  computed: {
    viewportStyle: function () {
      return {
        overflowX: this.scrollX ? 'auto' : 'hidden',
        overflowY: this.scrollY ? 'auto' : 'hidden'
      }
    }
  },
  watch: {
    scrollTop: function (value) { this.setScrollPosition('top', value) },
    scrollLeft: function (value) { this.setScrollPosition('left', value) },
    scrollIntoView: function (id) {
      if (id) this.$nextTick(this.scrollToElement)
    }
  },
  mounted: function () {
    this.setScrollPosition('top', this.scrollTop)
    this.setScrollPosition('left', this.scrollLeft)
    if (this.scrollIntoView) this.$nextTick(this.scrollToElement)
  },
  methods: {
    setScrollPosition: function (axis, value) {
      var viewport = this.$refs.viewport
      if (!viewport) return
      var position = Math.max(0, Number(value) || 0)
      if (axis === 'top' && this.scrollY) viewport.scrollTop = position
      if (axis === 'left' && this.scrollX) viewport.scrollLeft = position
    },
    scrollToElement: function () {
      var viewport = this.$refs.viewport
      if (!viewport || !this.scrollIntoView || typeof document === 'undefined') return
      var target = document.getElementById(this.scrollIntoView)
      if (!target || !viewport.contains(target)) return
      if (this.scrollX) viewport.scrollLeft = target.offsetLeft
      if (this.scrollY) viewport.scrollTop = target.offsetTop
    },
    handleScroll: function () {
      var viewport = this.$refs.viewport
      if (!viewport) return
      var top = viewport.scrollTop
      var left = viewport.scrollLeft
      var detail = {
        scrollTop: top,
        scrollLeft: left,
        scrollHeight: viewport.scrollHeight,
        scrollWidth: viewport.scrollWidth,
        deltaY: top - this.previousTop,
        deltaX: left - this.previousLeft
      }
      this.previousTop = top
      this.previousLeft = left
      this.$emit('scroll', detail)

      var upper = (this.scrollY && top <= this.upperThreshold) || (this.scrollX && left <= this.upperThreshold)
      var lower = (this.scrollY && viewport.scrollHeight - viewport.clientHeight - top <= this.lowerThreshold) ||
        (this.scrollX && viewport.scrollWidth - viewport.clientWidth - left <= this.lowerThreshold)
      if (upper && !this.upperActive) this.$emit('scrolltoupper', detail)
      if (lower && !this.lowerActive) this.$emit('scrolltolower', detail)
      this.upperActive = upper
      this.lowerActive = lower
    }
  }
}
</script>
