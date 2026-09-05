<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    v-bind="$attrs"
    :style="scrollerStyle"
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
      previousTop: 0,
      previousLeft: 0,
      scrollIntoViewQueued: false,
      mutationObserver: null,
      boundaryState: {
        top: false,
        left: false,
        bottom: false,
        right: false
      }
    }
  },
  computed: {
    scrollerStyle () {
      return {
        overflowX: this.scrollX ? 'auto' : 'hidden',
        overflowY: this.scrollY ? 'auto' : 'hidden'
      }
    }
  },
  watch: {
    scrollTop (value) {
      this.$nextTick(() => this.setScrollTop(value))
    },
    scrollLeft (value) {
      this.$nextTick(() => this.setScrollLeft(value))
    },
    scrollIntoView () {
      this.queueScrollIntoView()
    },
    scrollX () {
      this.$nextTick(this.syncControlledPosition)
    },
    scrollY () {
      this.$nextTick(this.syncControlledPosition)
    }
  },
  mounted () {
    this.syncControlledPosition()
    this.previousTop = this.$refs.scroller.scrollTop
    this.previousLeft = this.$refs.scroller.scrollLeft

    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => {
        this.queueScrollIntoView()
      })
      this.mutationObserver.observe(this.$refs.scroller, {
        childList: true,
        subtree: true
      })
    }

    this.queueScrollIntoView()
  },
  updated () {
    this.queueScrollIntoView()
  },
  beforeDestroy () {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }
  },
  methods: {
    normalizePosition (value) {
      const number = Number(value)
      return Number.isFinite(number) ? Math.max(0, number) : 0
    },
    normalizeThreshold (value) {
      const number = Number(value)
      return Number.isFinite(number) ? Math.max(0, number) : 0
    },
    syncControlledPosition () {
      this.setScrollTop(this.scrollTop)
      this.setScrollLeft(this.scrollLeft)
    },
    setScrollTop (value) {
      const scroller = this.$refs.scroller
      if (scroller && this.scrollY) {
        scroller.scrollTop = this.normalizePosition(value)
      }
    },
    setScrollLeft (value) {
      const scroller = this.$refs.scroller
      if (scroller && this.scrollX) {
        scroller.scrollLeft = this.normalizePosition(value)
      }
    },
    queueScrollIntoView () {
      if (!this.scrollIntoView || this.scrollIntoViewQueued) return

      this.scrollIntoViewQueued = true
      this.$nextTick(() => {
        this.scrollIntoViewQueued = false
        this.scrollToTarget()
      })
    },
    scrollToTarget () {
      const scroller = this.$refs.scroller
      if (!scroller || !this.scrollIntoView) return

      const expectedId = String(this.scrollIntoView)
      const target = Array.prototype.find.call(
        scroller.querySelectorAll('[id]'),
        (node) => node.id === expectedId
      )
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
    createEvent (type, detail, originalEvent) {
      const scroller = this.$refs.scroller
      return {
        type,
        timeStamp: originalEvent ? originalEvent.timeStamp : Date.now(),
        detail,
        target: scroller,
        currentTarget: scroller,
        originalEvent: originalEvent || null
      }
    },
    getScrollDetail (scroller) {
      const scrollTop = scroller.scrollTop
      const scrollLeft = scroller.scrollLeft
      const detail = {
        scrollTop,
        scrollLeft,
        scrollHeight: scroller.scrollHeight,
        scrollWidth: scroller.scrollWidth,
        deltaX: scrollLeft - this.previousLeft,
        deltaY: scrollTop - this.previousTop
      }

      this.previousTop = scrollTop
      this.previousLeft = scrollLeft
      return detail
    },
    emitBoundary (eventName, direction, active, detail, originalEvent) {
      if (active && !this.boundaryState[direction]) {
        this.$emit(
          eventName,
          this.createEvent(eventName, { ...detail, direction }, originalEvent)
        )
      }
      this.boundaryState[direction] = active
    },
    updateBoundaries (detail, originalEvent) {
      const scroller = this.$refs.scroller
      const upper = this.normalizeThreshold(this.upperThreshold)
      const lower = this.normalizeThreshold(this.lowerThreshold)
      const verticalRange = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
      const horizontalRange = Math.max(0, scroller.scrollWidth - scroller.clientWidth)

      this.emitBoundary(
        'scrolltoupper',
        'top',
        this.scrollY && detail.scrollTop <= upper,
        detail,
        originalEvent
      )
      this.emitBoundary(
        'scrolltoupper',
        'left',
        this.scrollX && detail.scrollLeft <= upper,
        detail,
        originalEvent
      )
      this.emitBoundary(
        'scrolltolower',
        'bottom',
        this.scrollY && verticalRange > 0 && verticalRange - detail.scrollTop <= lower,
        detail,
        originalEvent
      )
      this.emitBoundary(
        'scrolltolower',
        'right',
        this.scrollX && horizontalRange > 0 && horizontalRange - detail.scrollLeft <= lower,
        detail,
        originalEvent
      )
    },
    handleScroll (event) {
      const scroller = this.$refs.scroller
      if (!scroller) return

      const detail = this.getScrollDetail(scroller)
      this.$emit('scroll', this.createEvent('scroll', detail, event))
      this.updateBoundaries(detail, event)
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
