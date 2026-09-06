<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :class="$attrs.class"
    :style="[$attrs.style, scrollStyle]"
    :data-scroll-x="scrollX"
    :data-scroll-y="scrollY"
    v-bind="passthroughAttrs"
    v-on="passthroughListeners"
    @scroll="handleScroll"
  >
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
    lowerThreshold: { type: Number, default: 50 },
    scrollWithAnimation: { type: Boolean, default: false }
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
    passthroughAttrs () {
      const attrs = Object.assign({}, this.$attrs)
      delete attrs.class
      delete attrs.style
      return attrs
    },
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
    scrollTop (value) { this.setPosition('top', value) },
    scrollLeft (value) { this.setPosition('left', value) },
    scrollIntoView () { this.scrollTargetIntoView() }
  },
  mounted () {
    this.setPosition('top', this.scrollTop)
    this.setPosition('left', this.scrollLeft)
    this.scrollTargetIntoView()
  },
  updated () {
    this.scrollTargetIntoView()
  },
  methods: {
    setPosition (axis, value) {
      this.$nextTick(() => {
        const node = this.$refs.scroller
        if (!node) return
        node[axis === 'top' ? 'scrollTop' : 'scrollLeft'] = Number(value) || 0
      })
    },
    scrollTargetIntoView () {
      const id = this.scrollIntoView
      if (!id) return
      this.$nextTick(() => {
        const node = this.$refs.scroller
        if (!node || !node.querySelector) return
        const target = Array.prototype.slice.call(node.querySelectorAll('[id]')).find((item) => item.id === id)
        if (!target) return
        node.scrollLeft = target.offsetLeft - node.offsetLeft
        node.scrollTop = target.offsetTop - node.offsetTop
      })
    },
    handleScroll (event) {
      const node = event.currentTarget
      const detail = {
        scrollTop: node.scrollTop,
        scrollLeft: node.scrollLeft,
        scrollHeight: node.scrollHeight,
        scrollWidth: node.scrollWidth,
        deltaX: node.scrollLeft - this.lastLeft,
        deltaY: node.scrollTop - this.lastTop
      }
      this.lastTop = node.scrollTop
      this.lastLeft = node.scrollLeft
      this.$emit('scroll', detail)
      this.emitEdges(node, detail)
    },
    emitEdges (node, detail) {
      const upper = Number(this.upperThreshold) || 0
      const lower = Number(this.lowerThreshold) || 0
      this.emitEdge('top', this.scrollY && node.scrollTop <= upper, detail, this.upperEdges, 'scrolltoupper')
      this.emitEdge('left', this.scrollX && node.scrollLeft <= upper, detail, this.upperEdges, 'scrolltoupper')
      this.emitEdge('bottom', this.scrollY && node.scrollHeight - node.clientHeight - node.scrollTop <= lower, detail, this.lowerEdges, 'scrolltolower')
      this.emitEdge('right', this.scrollX && node.scrollWidth - node.clientWidth - node.scrollLeft <= lower, detail, this.lowerEdges, 'scrolltolower')
    },
    emitEdge (direction, active, detail, state, eventName) {
      if (active && !state[direction]) this.$emit(eventName, Object.assign({ direction }, detail))
      state[direction] = active
    }
  }
}
</script>

<style scoped>
.analytics-scroll { box-sizing: border-box; }
</style>
