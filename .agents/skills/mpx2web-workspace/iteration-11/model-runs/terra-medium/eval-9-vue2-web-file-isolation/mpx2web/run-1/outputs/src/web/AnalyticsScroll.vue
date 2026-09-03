<template>
  <div
    ref="viewport"
    class="analytics-scroll"
    :class="$attrs.class"
    :style="[scrollStyle, $attrs.style]"
    v-bind="forwardedAttrs"
    v-on="forwardedListeners"
    @scroll="onScroll"
  >
    <slot></slot>
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
    scrollIntoView: { type: [String, Number], default: '' },
    upperThreshold: { type: Number, default: 50 },
    lowerThreshold: { type: Number, default: 50 }
  },
  data () {
    return {
      lastScrollTop: 0,
      lastScrollLeft: 0,
      upperActive: { top: false, left: false },
      lowerActive: { bottom: false, right: false }
    }
  },
  computed: {
    scrollStyle () {
      return {
        overflowX: this.scrollX ? 'auto' : 'hidden',
        overflowY: this.scrollY ? 'auto' : 'hidden'
      }
    },
    forwardedListeners () {
      const listeners = {}
      Object.keys(this.$listeners).forEach((name) => {
        if (name !== 'scroll' && name !== 'scrolltoupper' && name !== 'scrolltolower') {
          listeners[name] = this.$listeners[name]
        }
      })
      return listeners
    },
    forwardedAttrs () {
      const attrs = {}
      Object.keys(this.$attrs).forEach((name) => {
        if (name !== 'class' && name !== 'style') attrs[name] = this.$attrs[name]
      })
      return attrs
    }
  },
  watch: {
    scrollTop: { immediate: true, handler (value) { this.setScrollPosition('top', value) } },
    scrollLeft: { immediate: true, handler (value) { this.setScrollPosition('left', value) } },
    scrollIntoView: { immediate: true, handler () { this.scrollToTarget() } }
  },
  mounted () {
    const viewport = this.$refs.viewport
    this.lastScrollTop = viewport.scrollTop
    this.lastScrollLeft = viewport.scrollLeft
    this.updateBoundaryState(false)
  },
  methods: {
    setScrollPosition (axis, value) {
      this.$nextTick(() => {
        const viewport = this.$refs.viewport
        const position = Number(value)
        if (!viewport || !Number.isFinite(position)) return
        if (axis === 'top' && this.scrollY) viewport.scrollTop = position
        if (axis === 'left' && this.scrollX) viewport.scrollLeft = position
      })
    },
    scrollToTarget () {
      this.$nextTick(() => {
        const viewport = this.$refs.viewport
        const targetId = this.scrollIntoView
        if (!viewport || targetId === '' || targetId === null || targetId === undefined) return
        const target = Array.prototype.find.call(viewport.querySelectorAll('[id]'), (node) => node.id === String(targetId))
        if (!target) return
        const viewportRect = viewport.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()
        if (this.scrollY) viewport.scrollTop += targetRect.top - viewportRect.top
        if (this.scrollX) viewport.scrollLeft += targetRect.left - viewportRect.left
      })
    },
    onScroll () {
      const viewport = this.$refs.viewport
      const detail = {
        scrollTop: viewport.scrollTop,
        scrollLeft: viewport.scrollLeft,
        scrollHeight: viewport.scrollHeight,
        scrollWidth: viewport.scrollWidth,
        deltaX: viewport.scrollLeft - this.lastScrollLeft,
        deltaY: viewport.scrollTop - this.lastScrollTop
      }
      this.lastScrollTop = viewport.scrollTop
      this.lastScrollLeft = viewport.scrollLeft
      this.$emit('scroll', detail)
      this.updateBoundaryState(true)
    },
    updateBoundaryState (emitEvents) {
      const viewport = this.$refs.viewport
      if (!viewport) return
      const upperThreshold = Math.max(0, Number(this.upperThreshold) || 0)
      const lowerThreshold = Math.max(0, Number(this.lowerThreshold) || 0)
      const states = {
        top: this.scrollY && viewport.scrollTop <= upperThreshold,
        left: this.scrollX && viewport.scrollLeft <= upperThreshold,
        bottom: this.scrollY && viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= lowerThreshold,
        right: this.scrollX && viewport.scrollWidth - viewport.clientWidth - viewport.scrollLeft <= lowerThreshold
      }
      ;['top', 'left'].forEach((direction) => {
        if (emitEvents && states[direction] && !this.upperActive[direction]) {
          this.$emit('scrolltoupper', { direction })
        }
        this.upperActive[direction] = states[direction]
      })
      ;['bottom', 'right'].forEach((direction) => {
        if (emitEvents && states[direction] && !this.lowerActive[direction]) {
          this.$emit('scrolltolower', { direction })
        }
        this.lowerActive[direction] = states[direction]
      })
    }
  }
}
</script>
