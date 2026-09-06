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
const FORWARDED_SCROLL_EVENTS = [
  'scroll',
  'scrolltoupper',
  'scrolltolower'
]

export default {
  name: 'AnalyticsScroll',
  inheritAttrs: false,
  props: {
    scrollX: {
      type: Boolean,
      default: false
    },
    scrollY: {
      type: Boolean,
      default: false
    },
    scrollTop: {
      type: Number,
      default: 0
    },
    scrollLeft: {
      type: Number,
      default: 0
    },
    scrollIntoView: {
      type: String,
      default: ''
    },
    upperThreshold: {
      type: [Number, String],
      default: 50
    },
    lowerThreshold: {
      type: [Number, String],
      default: 50
    }
  },
  computed: {
    scrollStyle () {
      return {
        overflowX: this.scrollX ? 'auto' : 'hidden',
        overflowY: this.scrollY ? 'auto' : 'hidden'
      }
    },
    passthroughListeners () {
      const listeners = { ...this.$listeners }
      FORWARDED_SCROLL_EVENTS.forEach((eventName) => {
        delete listeners[eventName]
      })
      return listeners
    }
  },
  watch: {
    scrollTop () {
      this.queuePositionSync()
    },
    scrollLeft () {
      this.queuePositionSync()
    },
    scrollIntoView () {
      this.queueScrollIntoView()
    },
    scrollX () {
      this.queueEdgeRefresh()
    },
    scrollY () {
      this.queueEdgeRefresh()
    },
    upperThreshold () {
      this.queueEdgeRefresh()
    },
    lowerThreshold () {
      this.queueEdgeRefresh()
    }
  },
  created () {
    this._scrollDestroyed = false
    this._lastScrollTop = 0
    this._lastScrollLeft = 0
    this._edgeState = {
      top: false,
      left: false,
      bottom: false,
      right: false
    }
    this._mutationObserver = null
    this._resizeObserver = null
  },
  mounted () {
    this.syncControlledPosition()
    this._lastScrollTop = this.$refs.scroller.scrollTop
    this._lastScrollLeft = this.$refs.scroller.scrollLeft
    this.refreshEdgeState(false)
    this.observeLayoutChanges()
    this.queueScrollIntoView()
  },
  updated () {
    this.queueScrollIntoView()
  },
  beforeDestroy () {
    this._scrollDestroyed = true
    const mutationObserver = this._mutationObserver
    const resizeObserver = this._resizeObserver
    this._mutationObserver = null
    this._resizeObserver = null
    if (mutationObserver) mutationObserver.disconnect()
    if (resizeObserver) resizeObserver.disconnect()
  },
  methods: {
    queuePositionSync () {
      this.$nextTick(() => {
        if (!this._scrollDestroyed) this.syncControlledPosition()
      })
    },
    syncControlledPosition () {
      const scroller = this.$refs.scroller
      if (!scroller) return
      const top = this.toPosition(this.scrollTop)
      const left = this.toPosition(this.scrollLeft)
      if (this.scrollY && scroller.scrollTop !== top) scroller.scrollTop = top
      if (this.scrollX && scroller.scrollLeft !== left) scroller.scrollLeft = left
    },
    queueScrollIntoView () {
      this.$nextTick(() => {
        if (!this._scrollDestroyed) this.applyScrollIntoView()
      })
    },
    applyScrollIntoView () {
      const scroller = this.$refs.scroller
      const targetId = this.scrollIntoView
      if (!scroller || !targetId || (!this.scrollX && !this.scrollY)) return

      const candidates = scroller.querySelectorAll('[id]')
      let target = null
      for (let index = 0; index < candidates.length; index += 1) {
        if (candidates[index].id === targetId) {
          target = candidates[index]
          break
        }
      }
      if (!target) return

      const scrollerRect = scroller.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      if (this.scrollY) {
        scroller.scrollTop += targetRect.top - scrollerRect.top - scroller.clientTop
      }
      if (this.scrollX) {
        scroller.scrollLeft += targetRect.left - scrollerRect.left - scroller.clientLeft
      }
    },
    handleScroll () {
      const scroller = this.$refs.scroller
      if (!scroller) return
      const scrollTop = scroller.scrollTop
      const scrollLeft = scroller.scrollLeft
      const detail = {
        scrollTop,
        scrollLeft,
        scrollHeight: scroller.scrollHeight,
        scrollWidth: scroller.scrollWidth,
        deltaX: scrollLeft - this._lastScrollLeft,
        deltaY: scrollTop - this._lastScrollTop
      }
      this._lastScrollTop = scrollTop
      this._lastScrollLeft = scrollLeft
      this.$emit('scroll', { detail })
      this.refreshEdgeState(true)
    },
    refreshEdgeState (emitCrossing) {
      const scroller = this.$refs.scroller
      if (!scroller) return
      const upperThreshold = this.toThreshold(this.upperThreshold)
      const lowerThreshold = this.toThreshold(this.lowerThreshold)
      const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
      const maxLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
      const nextState = {
        top: this.scrollY && scroller.scrollTop <= upperThreshold,
        left: this.scrollX && scroller.scrollLeft <= upperThreshold,
        bottom: this.scrollY && maxTop - scroller.scrollTop <= lowerThreshold,
        right: this.scrollX && maxLeft - scroller.scrollLeft <= lowerThreshold
      }

      if (emitCrossing) {
        if (nextState.top && !this._edgeState.top) this.emitEdge('scrolltoupper', 'top')
        if (nextState.left && !this._edgeState.left) this.emitEdge('scrolltoupper', 'left')
        if (nextState.bottom && !this._edgeState.bottom) this.emitEdge('scrolltolower', 'bottom')
        if (nextState.right && !this._edgeState.right) this.emitEdge('scrolltolower', 'right')
      }
      this._edgeState = nextState
    },
    emitEdge (eventName, direction) {
      this.$emit(eventName, { detail: { direction } })
    },
    queueEdgeRefresh () {
      this.$nextTick(() => {
        if (!this._scrollDestroyed) this.refreshEdgeState(false)
      })
    },
    observeLayoutChanges () {
      const scroller = this.$refs.scroller
      if (!scroller) return
      if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(() => {
          if (this._scrollDestroyed || this._mutationObserver !== observer) return
          this.queueScrollIntoView()
          this.refreshEdgeState(false)
        })
        this._mutationObserver = observer
        observer.observe(scroller, { childList: true, subtree: true })
      }
      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => {
          if (this._scrollDestroyed || this._resizeObserver !== observer) return
          this.queueScrollIntoView()
          this.refreshEdgeState(false)
        })
        this._resizeObserver = observer
        observer.observe(scroller)
        Array.prototype.forEach.call(scroller.children, (child) => observer.observe(child))
      }
    },
    toPosition (value) {
      const position = Number(value)
      return Number.isFinite(position) ? Math.max(0, position) : 0
    },
    toThreshold (value) {
      const threshold = Number(value)
      return Number.isFinite(threshold) ? Math.max(0, threshold) : 0
    }
  }
}
</script>

<style>
.analytics-scroll {
  display: block;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}
</style>
