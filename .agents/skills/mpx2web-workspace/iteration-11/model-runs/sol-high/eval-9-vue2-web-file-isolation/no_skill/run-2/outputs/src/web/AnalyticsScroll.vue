<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :class="{
      'analytics-scroll--x': xEnabled,
      'analytics-scroll--y': yEnabled
    }"
    @scroll.passive="handleScroll"
  >
    <slot />
  </div>
</template>

<script>
function numberValue (value, fallback) {
  const result = Number(value)
  return Number.isFinite(result) ? result : fallback
}

export default {
  name: 'AnalyticsScroll',
  props: {
    scrollX: {
      type: [Boolean, String],
      default: false
    },
    scrollY: {
      type: [Boolean, String],
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
  data () {
    return {
      lastScrollTop: 0,
      lastScrollLeft: 0,
      atUpperX: false,
      atUpperY: false,
      atLowerX: false,
      atLowerY: false,
      contentObserver: null
    }
  },
  computed: {
    xEnabled () {
      return this.scrollX !== false && this.scrollX !== 'false'
    },
    yEnabled () {
      return this.scrollY !== false && this.scrollY !== 'false'
    }
  },
  watch: {
    scrollTop () {
      this.$nextTick(this.syncScrollTop)
    },
    scrollLeft () {
      this.$nextTick(this.syncScrollLeft)
    },
    scrollIntoView () {
      this.queueIntoViewSync()
    },
    xEnabled () {
      this.$nextTick(this.resetEdgeState)
    },
    yEnabled () {
      this.$nextTick(this.resetEdgeState)
    }
  },
  mounted () {
    this.observeContent()
    this.$nextTick(() => {
      this.syncPosition()
      this.syncIntoView()
      this.resetEdgeState()
    })
  },
  beforeDestroy () {
    if (this.contentObserver) {
      this.contentObserver.disconnect()
      this.contentObserver = null
    }
  },
  methods: {
    queueIntoViewSync () {
      this.$nextTick(this.syncIntoView)
    },
    observeContent () {
      const scroller = this.$refs.scroller
      if (!scroller || typeof MutationObserver === 'undefined') return

      this.contentObserver = new MutationObserver(() => {
        if (this.scrollIntoView) {
          this.queueIntoViewSync()
        }
      })
      this.contentObserver.observe(scroller, {
        childList: true,
        subtree: true
      })
    },
    syncPosition () {
      this.syncScrollTop(false)
      this.syncScrollLeft(false)
      this.resetEdgeState()
    },
    syncScrollTop (resetEdges = true) {
      const scroller = this.$refs.scroller
      if (!scroller) return

      if (this.yEnabled) {
        scroller.scrollTop = Math.max(0, numberValue(this.scrollTop, 0))
      }
      this.lastScrollTop = scroller.scrollTop
      if (resetEdges) this.resetEdgeState()
    },
    syncScrollLeft (resetEdges = true) {
      const scroller = this.$refs.scroller
      if (!scroller) return

      if (this.xEnabled) {
        scroller.scrollLeft = Math.max(0, numberValue(this.scrollLeft, 0))
      }
      this.lastScrollLeft = scroller.scrollLeft
      if (resetEdges) this.resetEdgeState()
    },
    syncIntoView () {
      const scroller = this.$refs.scroller
      const id = this.scrollIntoView
      if (!scroller || !id) return

      const elements = scroller.querySelectorAll('[id]')
      let target = null
      for (let index = 0; index < elements.length; index += 1) {
        if (elements[index].id === id) {
          target = elements[index]
          break
        }
      }
      if (!target) return

      const scrollerRect = scroller.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      if (this.yEnabled) {
        scroller.scrollTop += targetRect.top - scrollerRect.top
      }
      if (this.xEnabled) {
        scroller.scrollLeft += targetRect.left - scrollerRect.left
      }
      this.lastScrollTop = scroller.scrollTop
      this.lastScrollLeft = scroller.scrollLeft
      this.resetEdgeState()
    },
    scrollDetail (scroller) {
      return {
        scrollLeft: scroller.scrollLeft,
        scrollTop: scroller.scrollTop,
        scrollHeight: scroller.scrollHeight,
        scrollWidth: scroller.scrollWidth,
        deltaX: scroller.scrollLeft - this.lastScrollLeft,
        deltaY: scroller.scrollTop - this.lastScrollTop
      }
    },
    eventPayload (type, detail, nativeEvent) {
      const scroller = this.$refs.scroller
      return {
        type,
        timeStamp: nativeEvent ? nativeEvent.timeStamp : Date.now(),
        target: scroller,
        currentTarget: scroller,
        detail,
        originalEvent: nativeEvent || null
      }
    },
    edgeState (detail) {
      const upperThreshold = Math.max(0, numberValue(this.upperThreshold, 50))
      const lowerThreshold = Math.max(0, numberValue(this.lowerThreshold, 50))
      const verticalUpper = this.yEnabled && detail.scrollTop <= upperThreshold
      const horizontalUpper = this.xEnabled && detail.scrollLeft <= upperThreshold
      const verticalDistance = detail.scrollHeight - detail.scrollTop - this.$refs.scroller.clientHeight
      const horizontalDistance = detail.scrollWidth - detail.scrollLeft - this.$refs.scroller.clientWidth
      const verticalLower = this.yEnabled && verticalDistance <= lowerThreshold
      const horizontalLower = this.xEnabled && horizontalDistance <= lowerThreshold

      return {
        upperX: horizontalUpper,
        upperY: verticalUpper,
        lowerX: horizontalLower,
        lowerY: verticalLower
      }
    },
    resetEdgeState () {
      const scroller = this.$refs.scroller
      if (!scroller) return
      const detail = this.scrollDetail(scroller)
      const state = this.edgeState(detail)
      this.atUpperX = state.upperX
      this.atUpperY = state.upperY
      this.atLowerX = state.lowerX
      this.atLowerY = state.lowerY
    },
    handleScroll (nativeEvent) {
      const scroller = this.$refs.scroller
      if (!scroller) return

      const detail = this.scrollDetail(scroller)
      const state = this.edgeState(detail)
      this.$emit('scroll', this.eventPayload('scroll', detail, nativeEvent))

      const reachedUpper = (state.upperX && !this.atUpperX) || (state.upperY && !this.atUpperY)
      const reachedLower = (state.lowerX && !this.atLowerX) || (state.lowerY && !this.atLowerY)
      if (reachedUpper) {
        this.$emit('scrolltoupper', this.eventPayload('scrolltoupper', detail, nativeEvent))
      }
      if (reachedLower) {
        this.$emit('scrolltolower', this.eventPayload('scrolltolower', detail, nativeEvent))
      }

      this.atUpperX = state.upperX
      this.atUpperY = state.upperY
      this.atLowerX = state.lowerX
      this.atLowerY = state.lowerY
      this.lastScrollTop = detail.scrollTop
      this.lastScrollLeft = detail.scrollLeft
    }
  }
}
</script>

<style>
.analytics-scroll {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: hidden;
  -webkit-overflow-scrolling: touch;
}

.analytics-scroll--x {
  overflow-x: auto;
}

.analytics-scroll--y {
  overflow-y: auto;
}
</style>
