<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :style="overflowStyle"
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
      isScrollMounted: false,
      mutationObserver: null,
      lastScrollTop: 0,
      lastScrollLeft: 0,
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
    scrollTop () {
      this.queueControlledPositionSync()
    },
    scrollLeft () {
      this.queueControlledPositionSync()
    },
    scrollIntoView () {
      this.queueScrollIntoView()
    },
    scrollX () {
      this.resetAxisEdges('x')
      this.queueControlledPositionSync()
    },
    scrollY () {
      this.resetAxisEdges('y')
      this.queueControlledPositionSync()
    }
  },
  mounted () {
    this.isScrollMounted = true
    this.$nextTick(() => {
      if (!this.isScrollMounted) return
      this.syncControlledPosition()
      this.scrollToCurrentTarget()
      this.captureCurrentPosition()
      this.observeChildren()
    })
  },
  beforeDestroy () {
    this.isScrollMounted = false
    const observer = this.mutationObserver
    this.mutationObserver = null
    if (observer) observer.disconnect()
  },
  methods: {
    finiteNumber (value, fallback) {
      const number = Number(value)
      return Number.isFinite(number) ? number : fallback
    },
    threshold (value) {
      return Math.max(0, this.finiteNumber(value, 0))
    },
    queueControlledPositionSync () {
      this.$nextTick(() => {
        if (!this.isScrollMounted) return
        this.syncControlledPosition()
      })
    },
    queueScrollIntoView () {
      this.$nextTick(() => {
        if (!this.isScrollMounted) return
        this.scrollToCurrentTarget()
      })
    },
    syncControlledPosition () {
      const scroller = this.$refs.scroller
      if (!scroller) return
      scroller.scrollTop = Math.max(0, this.finiteNumber(this.scrollTop, 0))
      scroller.scrollLeft = Math.max(0, this.finiteNumber(this.scrollLeft, 0))
    },
    captureCurrentPosition () {
      const scroller = this.$refs.scroller
      if (!scroller) return
      this.lastScrollTop = scroller.scrollTop
      this.lastScrollLeft = scroller.scrollLeft
    },
    findTargetById (id) {
      const scroller = this.$refs.scroller
      if (!scroller || !id) return null

      const candidates = scroller.querySelectorAll('[id]')
      for (let index = 0; index < candidates.length; index += 1) {
        if (candidates[index].id === String(id)) return candidates[index]
      }
      return null
    },
    scrollToCurrentTarget () {
      const scroller = this.$refs.scroller
      const target = this.findTargetById(this.scrollIntoView)
      if (!scroller || !target) return

      const scrollerRect = scroller.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      if (this.scrollY) {
        scroller.scrollTop += targetRect.top - scrollerRect.top
      }
      if (this.scrollX) {
        scroller.scrollLeft += targetRect.left - scrollerRect.left
      }
    },
    observeChildren () {
      const scroller = this.$refs.scroller
      if (!scroller || typeof MutationObserver === 'undefined') return

      const observer = new MutationObserver(() => {
        if (!this.isScrollMounted || this.mutationObserver !== observer) return
        this.queueScrollIntoView()
      })

      this.mutationObserver = observer
      observer.observe(scroller, { childList: true, subtree: true })
    },
    createEvent (type, detail, originalEvent) {
      const scroller = this.$refs.scroller
      return {
        type,
        detail,
        target: scroller,
        currentTarget: scroller,
        originalEvent
      }
    },
    handleScroll (event) {
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
      this.$emit('scroll', this.createEvent('scroll', detail, event))
      this.emitBoundaryEvents(detail, event)
    },
    emitBoundaryEvents (detail, originalEvent) {
      const scroller = this.$refs.scroller
      if (!scroller) return

      const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
      const maxLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
      const upper = this.threshold(this.upperThreshold)
      const lower = this.threshold(this.lowerThreshold)

      this.updateBoundary(
        'top',
        this.scrollY && detail.scrollTop <= upper,
        'scrolltoupper',
        'top',
        detail,
        originalEvent
      )
      this.updateBoundary(
        'left',
        this.scrollX && detail.scrollLeft <= upper,
        'scrolltoupper',
        'left',
        detail,
        originalEvent
      )
      this.updateBoundary(
        'bottom',
        this.scrollY && maxTop > 0 && maxTop - detail.scrollTop <= lower,
        'scrolltolower',
        'bottom',
        detail,
        originalEvent
      )
      this.updateBoundary(
        'right',
        this.scrollX && maxLeft > 0 && maxLeft - detail.scrollLeft <= lower,
        'scrolltolower',
        'right',
        detail,
        originalEvent
      )
    },
    updateBoundary (edge, inside, eventName, direction, detail, originalEvent) {
      if (inside && !this.edgeState[edge]) {
        const boundaryDetail = Object.assign({}, detail, { direction })
        this.$emit(eventName, this.createEvent(eventName, boundaryDetail, originalEvent))
      }
      this.edgeState[edge] = inside
    },
    resetAxisEdges (axis) {
      if (axis === 'x') {
        this.edgeState.left = false
        this.edgeState.right = false
      } else {
        this.edgeState.top = false
        this.edgeState.bottom = false
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
  overscroll-behavior: contain;
}
</style>
