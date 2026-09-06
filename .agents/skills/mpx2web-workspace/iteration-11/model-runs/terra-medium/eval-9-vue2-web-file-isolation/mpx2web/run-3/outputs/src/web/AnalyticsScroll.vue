<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :style="scrollStyle"
    v-bind="$attrs"
    v-on="passthroughListeners"
    @scroll="handleScroll"
  >
    <slot />
  </div>
</template>

<script>
export default {
  inheritAttrs: false,
  props: {
    scrollX: { type: Boolean, default: false },
    scrollY: { type: Boolean, default: false },
    scrollTop: { type: Number, default: 0 },
    scrollLeft: { type: Number, default: 0 },
    scrollIntoView: { type: String, default: '' },
    scrollWithAnimation: { type: Boolean, default: false },
    upperThreshold: { type: Number, default: 50 },
    lowerThreshold: { type: Number, default: 50 }
  },
  data () {
    return {
      lastTop: 0,
      lastLeft: 0,
      upperEdges: { top: false, left: false },
      lowerEdges: { bottom: false, right: false }
    }
  },
  computed: {
    passthroughListeners () {
      const listeners = Object.assign({}, this.$listeners)
      delete listeners.scroll
      delete listeners.scrolltoupper
      delete listeners.scrolltolower
      return listeners
    },
    scrollStyle () {
      return {
        overflowX: this.scrollX ? 'auto' : 'hidden',
        overflowY: this.scrollY ? 'auto' : 'hidden',
        scrollBehavior: this.scrollWithAnimation ? 'smooth' : 'auto'
      }
    }
  },
  watch: {
    scrollTop: 'syncPosition',
    scrollLeft: 'syncPosition',
    scrollIntoView: 'syncIntoView'
  },
  mounted () {
    this.$nextTick(() => {
      this.syncPosition()
      this.syncIntoView()
    })
  },
  updated () {
    this.syncIntoView()
  },
  methods: {
    getScroller () {
      return this.$refs.scroller
    },
    syncPosition () {
      this.$nextTick(() => {
        const node = this.getScroller()
        if (!node) return
        if (this.scrollY) node.scrollTop = Number(this.scrollTop) || 0
        if (this.scrollX) node.scrollLeft = Number(this.scrollLeft) || 0
      })
    },
    syncIntoView () {
      const id = this.scrollIntoView
      if (!id) return
      this.$nextTick(() => {
        const node = this.getScroller()
        if (!node) return
        const target = Array.prototype.find.call(node.querySelectorAll('[id]'), (item) => item.id === id)
        if (!target) return
        const targetRect = target.getBoundingClientRect()
        const nodeRect = node.getBoundingClientRect()
        const top = node.scrollTop + targetRect.top - nodeRect.top
        const left = node.scrollLeft + targetRect.left - nodeRect.left
        if (this.scrollY) node.scrollTop = top
        if (this.scrollX) node.scrollLeft = left
      })
    },
    handleScroll () {
      const node = this.getScroller()
      if (!node) return
      const detail = {
        scrollTop: node.scrollTop,
        scrollLeft: node.scrollLeft,
        scrollHeight: node.scrollHeight,
        scrollWidth: node.scrollWidth,
        deltaY: node.scrollTop - this.lastTop,
        deltaX: node.scrollLeft - this.lastLeft
      }
      this.lastTop = node.scrollTop
      this.lastLeft = node.scrollLeft
      this.$emit('scroll', detail)
      this.emitEdges(node)
    },
    emitEdges (node) {
      const upper = Math.max(0, Number(this.upperThreshold) || 0)
      const lower = Math.max(0, Number(this.lowerThreshold) || 0)
      const states = {
        top: this.scrollY && node.scrollTop <= upper,
        left: this.scrollX && node.scrollLeft <= upper,
        bottom: this.scrollY && node.scrollHeight - node.clientHeight - node.scrollTop <= lower,
        right: this.scrollX && node.scrollWidth - node.clientWidth - node.scrollLeft <= lower
      }
      ;['top', 'left'].forEach((direction) => {
        if (states[direction] && !this.upperEdges[direction]) this.$emit('scrolltoupper', { direction })
        this.upperEdges[direction] = states[direction]
      })
      ;['bottom', 'right'].forEach((direction) => {
        if (states[direction] && !this.lowerEdges[direction]) this.$emit('scrolltolower', { direction })
        this.lowerEdges[direction] = states[direction]
      })
    }
  }
}
</script>

<style scoped>
.analytics-scroll { box-sizing: border-box; }
</style>
