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
      previousScrollTop: 0,
      previousScrollLeft: 0,
      boundaryState: {
        top: false,
        left: false,
        bottom: false,
        right: false
      },
      mutationObserver: null,
      scrollIntoViewPending: false
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
      this.schedulePositionSync()
    },
    scrollY () {
      this.schedulePositionSync()
    }
  },
  mounted () {
    this.syncPosition()
    this.observeChildren()
    this.scheduleScrollIntoView()
  },
  updated () {
    this.scheduleScrollIntoView()
  },
  beforeDestroy () {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }
    this.scrollIntoViewPending = false
  },
  methods: {
    schedulePositionSync () {
      this.$nextTick(() => this.syncPosition())
    },
    syncPosition () {
      const scroller = this.$refs.scroller
      if (!scroller) return

      if (this.scrollY) {
        scroller.scrollTop = this.toFiniteNumber(this.scrollTop)
      }
      if (this.scrollX) {
        scroller.scrollLeft = this.toFiniteNumber(this.scrollLeft)
      }
      this.previousScrollTop = scroller.scrollTop
      this.previousScrollLeft = scroller.scrollLeft
    },
    scheduleScrollIntoView () {
      if (this.scrollIntoViewPending) return
      this.scrollIntoViewPending = true
      this.$nextTick(() => {
        this.scrollIntoViewPending = false
        this.scrollToTarget()
      })
    },
    scrollToTarget () {
      const scroller = this.$refs.scroller
      const targetId = this.scrollIntoView
      if (!scroller || !targetId) return

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
        scroller.scrollTop += targetRect.top - scrollerRect.top
      }
      if (this.scrollX) {
        scroller.scrollLeft += targetRect.left - scrollerRect.left
      }
      this.previousScrollTop = scroller.scrollTop
      this.previousScrollLeft = scroller.scrollLeft
    },
    observeChildren () {
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
    handleScroll (event) {
      const scroller = this.$refs.scroller
      if (!scroller) return

      const detail = this.createScrollDetail(scroller)
      this.$emit('scroll', this.createMpxEvent('scroll', detail, event))
      this.emitBoundaryEvents(detail, event)
      this.previousScrollTop = detail.scrollTop
      this.previousScrollLeft = detail.scrollLeft
    },
    createScrollDetail (scroller) {
      const scrollTop = scroller.scrollTop
      const scrollLeft = scroller.scrollLeft
      return {
        scrollTop,
        scrollLeft,
        scrollHeight: scroller.scrollHeight,
        scrollWidth: scroller.scrollWidth,
        deltaX: scrollLeft - this.previousScrollLeft,
        deltaY: scrollTop - this.previousScrollTop
      }
    },
    emitBoundaryEvents (detail, originalEvent) {
      const scroller = this.$refs.scroller
      const upperThreshold = Math.max(0, this.toFiniteNumber(this.upperThreshold))
      const lowerThreshold = Math.max(0, this.toFiniteNumber(this.lowerThreshold))
      const nextState = {
        top: this.scrollY && detail.scrollTop <= upperThreshold,
        left: this.scrollX && detail.scrollLeft <= upperThreshold,
        bottom: this.scrollY && scroller.scrollHeight - scroller.clientHeight - detail.scrollTop <= lowerThreshold,
        right: this.scrollX && scroller.scrollWidth - scroller.clientWidth - detail.scrollLeft <= lowerThreshold
      }

      ;['top', 'left'].forEach((direction) => {
        if (nextState[direction] && !this.boundaryState[direction]) {
          this.$emit(
            'scrolltoupper',
            this.createMpxEvent('scrolltoupper', { ...detail, direction }, originalEvent)
          )
        }
      })
      ;['bottom', 'right'].forEach((direction) => {
        if (nextState[direction] && !this.boundaryState[direction]) {
          this.$emit(
            'scrolltolower',
            this.createMpxEvent('scrolltolower', { ...detail, direction }, originalEvent)
          )
        }
      })
      this.boundaryState = nextState
    },
    createMpxEvent (type, detail, originalEvent) {
      const scroller = this.$refs.scroller
      return {
        type,
        detail,
        target: scroller,
        currentTarget: scroller,
        originalEvent
      }
    },
    toFiniteNumber (value) {
      const number = Number(value)
      return Number.isFinite(number) ? number : 0
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
</style>
