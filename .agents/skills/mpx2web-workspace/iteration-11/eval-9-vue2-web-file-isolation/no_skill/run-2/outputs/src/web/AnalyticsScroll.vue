<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :style="scrollStyle"
    @scroll="handleNativeScroll"
  >
    <slot />
  </div>
</template>

<script>
function finiteNumber (value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

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
  created () {
    this._lastScrollTop = 0
    this._lastScrollLeft = 0
    this._atUpperEdge = false
    this._atLowerEdge = false
    this._intoViewFrame = 0
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
    scrollTop (value) {
      this.setPosition('scrollTop', value)
    },
    scrollLeft (value) {
      this.setPosition('scrollLeft', value)
    },
    scrollIntoView () {
      this.scheduleIntoView()
    },
    scrollX () {
      this.resetEdges()
    },
    scrollY () {
      this.resetEdges()
    }
  },
  mounted () {
    this.$nextTick(() => {
      const scroller = this.$refs.scroller
      if (!scroller) return
      scroller.scrollTop = Math.max(0, finiteNumber(this.scrollTop, 0))
      scroller.scrollLeft = Math.max(0, finiteNumber(this.scrollLeft, 0))
      this._lastScrollTop = scroller.scrollTop
      this._lastScrollLeft = scroller.scrollLeft
      this.resetEdges()
      this.scheduleIntoView()
    })
  },
  updated () {
    if (this.scrollIntoView) this.scheduleIntoView()
  },
  beforeDestroy () {
    if (this._intoViewFrame && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this._intoViewFrame)
    }
    this._intoViewFrame = 0
  },
  methods: {
    setPosition (property, value) {
      this.$nextTick(() => {
        const scroller = this.$refs.scroller
        if (scroller) scroller[property] = Math.max(0, finiteNumber(value, 0))
      })
    },
    scheduleIntoView () {
      if (!this.scrollIntoView) return
      this.$nextTick(() => {
        if (this._intoViewFrame && typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(this._intoViewFrame)
        }
        if (typeof requestAnimationFrame !== 'function') {
          this.applyIntoView()
          return
        }
        this._intoViewFrame = requestAnimationFrame(() => {
          this._intoViewFrame = 0
          this.applyIntoView()
        })
      })
    },
    applyIntoView () {
      const scroller = this.$refs.scroller
      const requestedId = String(this.scrollIntoView || '')
      if (!scroller || !requestedId) return

      const candidates = scroller.querySelectorAll('[id]')
      let target = null
      for (let index = 0; index < candidates.length; index += 1) {
        if (candidates[index].id === requestedId) {
          target = candidates[index]
          break
        }
      }
      if (!target) return

      const scrollerRect = scroller.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      if (this.scrollY) {
        scroller.scrollTop += targetRect.top - scrollerRect.top
      }
      if (this.scrollX) {
        scroller.scrollLeft += targetRect.left - scrollerRect.left
      }
    },
    handleNativeScroll (nativeEvent) {
      const scroller = nativeEvent.currentTarget
      const detail = this.createDetail(scroller)
      this.$emit('scroll', this.createEvent('scroll', detail, nativeEvent))
      this.emitEdgeEvents(detail, nativeEvent)
      this._lastScrollTop = detail.scrollTop
      this._lastScrollLeft = detail.scrollLeft
    },
    createDetail (scroller) {
      const scrollTop = scroller.scrollTop
      const scrollLeft = scroller.scrollLeft
      return {
        scrollTop,
        scrollLeft,
        scrollHeight: scroller.scrollHeight,
        scrollWidth: scroller.scrollWidth,
        deltaX: scrollLeft - this._lastScrollLeft,
        deltaY: scrollTop - this._lastScrollTop
      }
    },
    createEvent (type, detail, nativeEvent) {
      const scroller = this.$refs.scroller
      return {
        type,
        timeStamp: nativeEvent ? nativeEvent.timeStamp : Date.now(),
        target: scroller,
        currentTarget: scroller,
        detail
      }
    },
    resetEdges () {
      const scroller = this.$refs.scroller
      if (!scroller) return
      const state = this.edgeState(this.createDetail(scroller))
      this._atUpperEdge = state.upper
      this._atLowerEdge = state.lower
    },
    edgeState (detail) {
      const scroller = this.$refs.scroller
      const canScrollY = Boolean(this.scrollY && scroller && detail.scrollHeight > scroller.clientHeight + 1)
      const canScrollX = Boolean(this.scrollX && scroller && detail.scrollWidth > scroller.clientWidth + 1)
      const useY = canScrollY || (this.scrollY && !canScrollX)
      const useX = canScrollX || (this.scrollX && !canScrollY)
      const upperThreshold = Math.max(0, finiteNumber(this.upperThreshold, 50))
      const lowerThreshold = Math.max(0, finiteNumber(this.lowerThreshold, 50))
      const upper = Boolean(
        (useY && detail.scrollTop <= upperThreshold) ||
        (useX && detail.scrollLeft <= upperThreshold)
      )
      const lower = Boolean(scroller && (
        (useY && detail.scrollTop + scroller.clientHeight >= detail.scrollHeight - lowerThreshold) ||
        (useX && detail.scrollLeft + scroller.clientWidth >= detail.scrollWidth - lowerThreshold)
      ))
      return { upper, lower }
    },
    emitEdgeEvents (detail, nativeEvent) {
      const state = this.edgeState(detail)
      if (state.upper && !this._atUpperEdge) {
        this.$emit('scrolltoupper', this.createEvent('scrolltoupper', detail, nativeEvent))
      }
      if (state.lower && !this._atLowerEdge) {
        this.$emit('scrolltolower', this.createEvent('scrolltolower', detail, nativeEvent))
      }
      this._atUpperEdge = state.upper
      this._atLowerEdge = state.lower
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
