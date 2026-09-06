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
  data: function () {
    return {
      lastTop: 0,
      lastLeft: 0,
      atUpper: false,
      atLower: false
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
    scrollTop: 'applyScrollTop',
    scrollLeft: 'applyScrollLeft',
    scrollIntoView: 'scrollToTarget'
  },
  mounted: function () {
    this.applyScrollTop(this.scrollTop)
    this.applyScrollLeft(this.scrollLeft)
    this.$nextTick(this.scrollToTarget)
  },
  methods: {
    applyScrollTop: function (value) {
      if (this.scrollY && this.$refs.viewport) this.$refs.viewport.scrollTop = Number(value) || 0
    },
    applyScrollLeft: function (value) {
      if (this.scrollX && this.$refs.viewport) this.$refs.viewport.scrollLeft = Number(value) || 0
    },
    scrollToTarget: function (id) {
      id = typeof id === 'string' ? id : this.scrollIntoView
      var viewport = this.$refs.viewport
      if (!id || !viewport || typeof document === 'undefined') return
      var target = document.getElementById(id)
      if (!target || !viewport.contains(target)) return
      var viewportRect = viewport.getBoundingClientRect()
      var targetRect = target.getBoundingClientRect()
      if (this.scrollY) {
        if (targetRect.top < viewportRect.top) viewport.scrollTop += targetRect.top - viewportRect.top
        if (targetRect.bottom > viewportRect.bottom) viewport.scrollTop += targetRect.bottom - viewportRect.bottom
      }
      if (this.scrollX) {
        if (targetRect.left < viewportRect.left) viewport.scrollLeft += targetRect.left - viewportRect.left
        if (targetRect.right > viewportRect.right) viewport.scrollLeft += targetRect.right - viewportRect.right
      }
    },
    handleScroll: function () {
      var viewport = this.$refs.viewport
      if (!viewport) return
      var detail = {
        scrollTop: viewport.scrollTop,
        scrollLeft: viewport.scrollLeft,
        scrollHeight: viewport.scrollHeight,
        scrollWidth: viewport.scrollWidth,
        deltaY: viewport.scrollTop - this.lastTop,
        deltaX: viewport.scrollLeft - this.lastLeft
      }
      this.lastTop = viewport.scrollTop
      this.lastLeft = viewport.scrollLeft
      this.$emit('scroll', detail)

      var threshold = Math.max(0, Number(this.upperThreshold) || 0)
      var position = this.scrollY ? viewport.scrollTop : viewport.scrollLeft
      var remaining = this.scrollY
        ? viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop
        : viewport.scrollWidth - viewport.clientWidth - viewport.scrollLeft
      if (position <= threshold) {
        if (!this.atUpper) this.$emit('scrolltoupper', detail)
        this.atUpper = true
      } else {
        this.atUpper = false
      }
      if (remaining <= Math.max(0, Number(this.lowerThreshold) || 0)) {
        if (!this.atLower) this.$emit('scrolltolower', detail)
        this.atLower = true
      } else {
        this.atLower = false
      }
    }
  }
}
</script>

<style scoped>
.analytics-scroll {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}
</style>
