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
      type: [Number, String],
      default: 0
    },
    scrollLeft: {
      type: [Number, String],
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
      const listeners = Object.assign({}, this.$listeners)
      delete listeners.scroll
      delete listeners.scrolltoupper
      delete listeners.scrolltolower
      return listeners
    }
  },
  watch: {
    scrollTop (value) {
      this.syncControlledAxis('scrollTop', value, this.scrollY)
    },
    scrollLeft (value) {
      this.syncControlledAxis('scrollLeft', value, this.scrollX)
    },
    scrollIntoView () {
      this.scheduleScrollIntoView()
    }
  },
  created () {
    this.lastScrollTop = 0
    this.lastScrollLeft = 0
    this.edgeState = {
      top: false,
      left: false,
      bottom: false,
      right: false
    }
    this.mutationObserver = null
    this.scrollIntoViewPending = false
  },
  mounted () {
    this.syncControlledAxis('scrollTop', this.scrollTop, this.scrollY)
    this.syncControlledAxis('scrollLeft', this.scrollLeft, this.scrollX)
    const scroller = this.$refs.scroller
    this.lastScrollTop = scroller.scrollTop
    this.lastScrollLeft = scroller.scrollLeft
    this.refreshBoundaryState()
    this.bindMutationObserver()
    this.scheduleScrollIntoView()
  },
  updated () {
    this.scheduleScrollIntoView()
  },
  beforeDestroy () {
    const observer = this.mutationObserver
    this.mutationObserver = null
    this.scrollIntoViewPending = false
    if (observer) observer.disconnect()
  },
  methods: {
    numberValue (value, fallback) {
      const number = Number(value)
      return Number.isFinite(number) ? number : fallback
    },
    syncControlledAxis (axis, value, enabled) {
      const scroller = this.$refs.scroller
      if (!scroller || !enabled) return
      const position = Math.max(0, this.numberValue(value, 0))
      if (scroller[axis] !== position) scroller[axis] = position
    },
    scheduleScrollIntoView () {
      if (this.scrollIntoViewPending) return
      this.scrollIntoViewPending = true
      this.$nextTick(() => {
        this.scrollIntoViewPending = false
        this.syncScrollIntoView()
      })
    },
    syncScrollIntoView () {
      const scroller = this.$refs.scroller
      const targetId = this.scrollIntoView
      if (!scroller || !targetId) return

      const nodes = scroller.querySelectorAll('[id]')
      let target = null
      for (let index = 0; index < nodes.length; index += 1) {
        if (nodes[index].id === targetId) {
          target = nodes[index]
          break
        }
      }
      if (!target) return

      const scrollerRect = scroller.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      if (this.scrollX) {
        scroller.scrollLeft += targetRect.left - scrollerRect.left
      }
      if (this.scrollY) {
        scroller.scrollTop += targetRect.top - scrollerRect.top
      }
    },
    bindMutationObserver () {
      const scroller = this.$refs.scroller
      const browserWindow = scroller && scroller.ownerDocument &&
        scroller.ownerDocument.defaultView
      const MutationObserverClass = browserWindow && browserWindow.MutationObserver
      if (!MutationObserverClass) return

      const observer = new MutationObserverClass(() => {
        if (this.mutationObserver !== observer) return
        this.refreshBoundaryState()
        this.scheduleScrollIntoView()
      })
      this.mutationObserver = observer
      observer.observe(scroller, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['id']
      })
    },
    scrollDetail (scroller) {
      const scrollTop = scroller.scrollTop
      const scrollLeft = scroller.scrollLeft
      return {
        scrollTop,
        scrollLeft,
        scrollHeight: scroller.scrollHeight,
        scrollWidth: scroller.scrollWidth,
        deltaX: scrollLeft - this.lastScrollLeft,
        deltaY: scrollTop - this.lastScrollTop
      }
    },
    currentBoundaryState () {
      const scroller = this.$refs.scroller
      if (!scroller) return {
        top: false,
        left: false,
        bottom: false,
        right: false
      }

      const upper = Math.max(0, this.numberValue(this.upperThreshold, 50))
      const lower = Math.max(0, this.numberValue(this.lowerThreshold, 50))
      const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
      const maxLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
      return {
        top: this.scrollY && scroller.scrollTop <= upper,
        left: this.scrollX && scroller.scrollLeft <= upper,
        bottom: this.scrollY && maxTop > 0 && maxTop - scroller.scrollTop <= lower,
        right: this.scrollX && maxLeft > 0 && maxLeft - scroller.scrollLeft <= lower
      }
    },
    refreshBoundaryState () {
      this.edgeState = this.currentBoundaryState()
    },
    emitBoundaryOnEntry (direction, eventName, inside, detail) {
      const wasInside = this.edgeState[direction]
      this.edgeState[direction] = inside
      if (inside && !wasInside) {
        this.$emit(eventName, Object.assign({ direction }, detail))
      }
    },
    handleScroll () {
      const scroller = this.$refs.scroller
      if (!scroller) return

      const detail = this.scrollDetail(scroller)
      const boundaries = this.currentBoundaryState()
      this.lastScrollTop = detail.scrollTop
      this.lastScrollLeft = detail.scrollLeft
      this.$emit('scroll', detail)
      this.emitBoundaryOnEntry('top', 'scrolltoupper', boundaries.top, detail)
      this.emitBoundaryOnEntry('left', 'scrolltoupper', boundaries.left, detail)
      this.emitBoundaryOnEntry('bottom', 'scrolltolower', boundaries.bottom, detail)
      this.emitBoundaryOnEntry('right', 'scrolltolower', boundaries.right, detail)
    }
  }
}
</script>

<style>
.analytics-scroll {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  -webkit-overflow-scrolling: touch;
}
</style>
