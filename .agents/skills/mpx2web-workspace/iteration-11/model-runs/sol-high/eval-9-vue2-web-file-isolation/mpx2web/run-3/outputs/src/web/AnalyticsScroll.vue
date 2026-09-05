<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :style="overflowStyle"
    @scroll.passive="handleScroll"
  >
    <div ref="content" class="analytics-scroll__content">
      <slot />
    </div>
  </div>
</template>

<script>
function numericValue (value, fallback) {
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
  data () {
    return {
      mutationObserver: null,
      resizeObserver: null,
      destroyed: false,
      refreshPending: false,
      refreshTop: false,
      refreshLeft: false,
      refreshTarget: false,
      previousLeft: 0,
      previousTop: 0,
      edgeState: {
        top: false,
        left: false,
        bottom: false,
        right: false
      }
    }
  },
  computed: {
    overflowStyle () {
      return {
        overflowX: this.scrollX ? 'auto' : 'hidden',
        overflowY: this.scrollY ? 'auto' : 'hidden'
      }
    }
  },
  watch: {
    scrollTop () {
      this.scheduleRefresh(true, false, false)
    },
    scrollLeft () {
      this.scheduleRefresh(false, true, false)
    },
    scrollIntoView () {
      this.scheduleRefresh(false, false, true)
    },
    scrollX () {
      this.resetEdgeState()
      this.scheduleRefresh(false, true, true)
    },
    scrollY () {
      this.resetEdgeState()
      this.scheduleRefresh(true, false, true)
    }
  },
  mounted () {
    this.destroyed = false
    this.installObservers()
    this.$nextTick(() => {
      if (this.destroyed) return
      this.syncControlledPosition()
      this.scrollToTarget()
      this.rememberPosition()
    })
  },
  beforeDestroy () {
    this.destroyed = true
    this.refreshPending = false

    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  },
  methods: {
    installObservers () {
      const scroller = this.$refs.scroller
      const content = this.$refs.content

      if (typeof MutationObserver !== 'undefined') {
        this.mutationObserver = new MutationObserver(() => this.scheduleRefresh(false, false, true))
        this.mutationObserver.observe(content, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['id', 'class', 'style']
        })
      }

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.scheduleRefresh(false, false, true))
        this.resizeObserver.observe(scroller)
        this.resizeObserver.observe(content)
      }
    },
    refresh () {
      this.scheduleRefresh(false, false, true)
    },
    scheduleRefresh (syncTop, syncLeft, syncTarget) {
      this.refreshTop = this.refreshTop || syncTop
      this.refreshLeft = this.refreshLeft || syncLeft
      this.refreshTarget = this.refreshTarget || syncTarget
      if (this.refreshPending) return

      this.refreshPending = true
      this.$nextTick(() => {
        this.refreshPending = false
        if (this.destroyed) return

        this.syncControlledPosition(this.refreshTop, this.refreshLeft)
        if (this.refreshTarget) this.scrollToTarget()
        this.refreshTop = false
        this.refreshLeft = false
        this.refreshTarget = false
      })
    },
    syncControlledPosition (syncTop = true, syncLeft = true) {
      const scroller = this.$refs.scroller
      if (!scroller) return

      const top = Math.max(0, numericValue(this.scrollTop, 0))
      const left = Math.max(0, numericValue(this.scrollLeft, 0))
      if (syncTop && scroller.scrollTop !== top) scroller.scrollTop = top
      if (syncLeft && scroller.scrollLeft !== left) scroller.scrollLeft = left
    },
    scrollToTarget () {
      const id = this.scrollIntoView
      const scroller = this.$refs.scroller
      if (!id || !scroller) return

      const candidates = scroller.querySelectorAll('[id]')
      let target = null
      for (let index = 0; index < candidates.length; index += 1) {
        if (candidates[index].id === id) {
          target = candidates[index]
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
    rememberPosition () {
      const scroller = this.$refs.scroller
      if (!scroller) return
      this.previousLeft = scroller.scrollLeft
      this.previousTop = scroller.scrollTop
    },
    handleScroll (originalEvent) {
      const scroller = this.$refs.scroller
      if (!scroller) return

      const detail = {
        scrollTop: scroller.scrollTop,
        scrollLeft: scroller.scrollLeft,
        scrollHeight: scroller.scrollHeight,
        scrollWidth: scroller.scrollWidth,
        deltaX: scroller.scrollLeft - this.previousLeft,
        deltaY: scroller.scrollTop - this.previousTop
      }
      this.previousLeft = scroller.scrollLeft
      this.previousTop = scroller.scrollTop

      this.$emit('scroll', this.createEvent('scroll', detail, originalEvent))
      this.emitBoundaryEvents(detail, originalEvent)
    },
    emitBoundaryEvents (detail, originalEvent) {
      const scroller = this.$refs.scroller
      const upper = Math.max(0, numericValue(this.upperThreshold, 50))
      const lower = Math.max(0, numericValue(this.lowerThreshold, 50))
      const maxLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
      const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
      const nextState = {
        top: this.scrollY && maxTop > 0 && detail.scrollTop <= upper,
        left: this.scrollX && maxLeft > 0 && detail.scrollLeft <= upper,
        bottom: this.scrollY && maxTop > 0 && maxTop - detail.scrollTop <= lower,
        right: this.scrollX && maxLeft > 0 && maxLeft - detail.scrollLeft <= lower
      }

      this.emitBoundary('scrolltoupper', 'top', nextState.top, detail, originalEvent)
      this.emitBoundary('scrolltoupper', 'left', nextState.left, detail, originalEvent)
      this.emitBoundary('scrolltolower', 'bottom', nextState.bottom, detail, originalEvent)
      this.emitBoundary('scrolltolower', 'right', nextState.right, detail, originalEvent)
      this.edgeState = nextState
    },
    emitBoundary (eventName, direction, active, detail, originalEvent) {
      if (!active || this.edgeState[direction]) return
      this.$emit(eventName, this.createEvent(eventName, {
        ...detail,
        direction
      }, originalEvent))
    },
    createEvent (type, detail, originalEvent) {
      return {
        type,
        detail,
        target: this.$refs.scroller,
        currentTarget: this.$refs.scroller,
        originalEvent
      }
    },
    resetEdgeState () {
      this.edgeState = {
        top: false,
        left: false,
        bottom: false,
        right: false
      }
    }
  }
}
</script>

<style scoped>
.analytics-scroll {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.analytics-scroll__content {
  min-width: 100%;
  min-height: 100%;
  box-sizing: border-box;
}
</style>
