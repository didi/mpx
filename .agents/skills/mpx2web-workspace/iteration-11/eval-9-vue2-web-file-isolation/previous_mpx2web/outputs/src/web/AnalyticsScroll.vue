<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :style="scrollStyle"
    @scroll="handleScroll"
  >
    <slot />
  </div>
</template>

<script>
function toFiniteNumber (value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export default {
  name: 'AnalyticsScroll',
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
      type: Number,
      default: 50
    },
    lowerThreshold: {
      type: Number,
      default: 50
    }
  },
  computed: {
    scrollStyle () {
      return {
        overflowX: this.scrollX ? 'auto' : 'hidden',
        overflowY: this.scrollY ? 'auto' : 'hidden'
      }
    }
  },
  watch: {
    scrollTop () {
      this.schedulePositionSync()
    },
    scrollLeft () {
      this.schedulePositionSync()
    },
    scrollIntoView () {
      this.scheduleScrollIntoView()
    },
    scrollX () {
      this.resetEdgeState()
      this.schedulePositionSync()
    },
    scrollY () {
      this.resetEdgeState()
      this.schedulePositionSync()
    }
  },
  created () {
    this.disposed = false
    this.positionSyncPending = false
    this.intoViewSyncPending = false
    this.mutationObserver = null
    this.lastScrollTop = 0
    this.lastScrollLeft = 0
    this.edgeState = {
      top: false,
      bottom: false,
      left: false,
      right: false
    }
  },
  mounted () {
    this.disposed = false
    this.syncPosition()
    this.observeContent()
    this.scheduleScrollIntoView()
  },
  beforeDestroy () {
    this.disposed = true
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }
  },
  methods: {
    schedulePositionSync () {
      if (this.positionSyncPending || this.disposed) return
      this.positionSyncPending = true
      this.$nextTick(() => {
        this.positionSyncPending = false
        if (!this.disposed) this.syncPosition()
      })
    },
    syncPosition () {
      const scroller = this.$refs.scroller
      if (!scroller) return

      const nextTop = this.scrollY ? Math.max(0, toFiniteNumber(this.scrollTop)) : 0
      const nextLeft = this.scrollX ? Math.max(0, toFiniteNumber(this.scrollLeft)) : 0
      if (scroller.scrollTop !== nextTop) scroller.scrollTop = nextTop
      if (scroller.scrollLeft !== nextLeft) scroller.scrollLeft = nextLeft
      this.lastScrollTop = scroller.scrollTop
      this.lastScrollLeft = scroller.scrollLeft
    },
    scheduleScrollIntoView () {
      if (this.intoViewSyncPending || this.disposed || !this.scrollIntoView) return
      this.intoViewSyncPending = true
      this.$nextTick(() => {
        this.intoViewSyncPending = false
        if (!this.disposed) this.applyScrollIntoView()
      })
    },
    applyScrollIntoView () {
      const scroller = this.$refs.scroller
      if (!scroller || !this.scrollIntoView) return

      const targetId = String(this.scrollIntoView)
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
        scroller.scrollTop = Math.max(0, scroller.scrollTop + targetRect.top - scrollerRect.top)
      }
      if (this.scrollX) {
        scroller.scrollLeft = Math.max(0, scroller.scrollLeft + targetRect.left - scrollerRect.left)
      }
      this.lastScrollTop = scroller.scrollTop
      this.lastScrollLeft = scroller.scrollLeft
    },
    observeContent () {
      const scroller = this.$refs.scroller
      if (!scroller || typeof MutationObserver === 'undefined') return

      this.mutationObserver = new MutationObserver(() => {
        this.scheduleScrollIntoView()
      })
      this.mutationObserver.observe(scroller, {
        childList: true,
        subtree: true
      })
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
        deltaX: scrollLeft - this.lastScrollLeft,
        deltaY: scrollTop - this.lastScrollTop
      }

      this.lastScrollTop = scrollTop
      this.lastScrollLeft = scrollLeft
      this.$emit('scroll', { detail })
      this.emitEdgeEvents(detail)
    },
    emitEdgeEvents (detail) {
      const scroller = this.$refs.scroller
      const upperThreshold = Math.max(0, toFiniteNumber(this.upperThreshold, 50))
      const lowerThreshold = Math.max(0, toFiniteNumber(this.lowerThreshold, 50))
      const nextEdgeState = {
        top: this.scrollY && detail.scrollTop <= upperThreshold,
        bottom: this.scrollY && scroller.scrollHeight > scroller.clientHeight &&
          scroller.scrollHeight - scroller.clientHeight - detail.scrollTop <= lowerThreshold,
        left: this.scrollX && detail.scrollLeft <= upperThreshold,
        right: this.scrollX && scroller.scrollWidth > scroller.clientWidth &&
          scroller.scrollWidth - scroller.clientWidth - detail.scrollLeft <= lowerThreshold
      }

      this.emitEdgeTransition('top', 'scrolltoupper', nextEdgeState.top, detail)
      this.emitEdgeTransition('left', 'scrolltoupper', nextEdgeState.left, detail)
      this.emitEdgeTransition('bottom', 'scrolltolower', nextEdgeState.bottom, detail)
      this.emitEdgeTransition('right', 'scrolltolower', nextEdgeState.right, detail)
      this.edgeState = nextEdgeState
    },
    emitEdgeTransition (direction, eventName, isAtEdge, detail) {
      if (isAtEdge && !this.edgeState[direction]) {
        this.$emit(eventName, {
          detail: Object.assign({}, detail, { direction })
        })
      }
    },
    resetEdgeState () {
      this.edgeState = {
        top: false,
        bottom: false,
        left: false,
        right: false
      }
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
