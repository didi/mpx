<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :style="scrollStyle"
    @scroll="handleScroll"
  >
    <slot />
    <slot name="content" />
  </div>
</template>

<script>
function toFiniteNumber (value, fallback) {
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
      edgeState: {
        upperX: false,
        upperY: false,
        lowerX: false,
        lowerY: false
      },
      lastScrollLeft: 0,
      lastScrollTop: 0,
      resizeObserver: null,
      mutationObserver: null,
      windowResizeHandler: null,
      componentDestroyed: false
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
    scrollTop (value) {
      this.setScrollPosition('top', value)
    },
    scrollLeft (value) {
      this.setScrollPosition('left', value)
    },
    scrollIntoView () {
      this.queueScrollIntoView()
    },
    scrollX () {
      this.$nextTick(this.syncEdgeState)
    },
    scrollY () {
      this.$nextTick(this.syncEdgeState)
    },
    upperThreshold () {
      this.syncEdgeState()
    },
    lowerThreshold () {
      this.syncEdgeState()
    }
  },
  mounted () {
    const scroller = this.$refs.scroller
    scroller.scrollTop = Math.max(0, toFiniteNumber(this.scrollTop, 0))
    scroller.scrollLeft = Math.max(0, toFiniteNumber(this.scrollLeft, 0))
    this.lastScrollTop = scroller.scrollTop
    this.lastScrollLeft = scroller.scrollLeft
    this.syncEdgeState()
    this.startObservers()
    this.queueScrollIntoView()
  },
  beforeDestroy () {
    this.componentDestroyed = true

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect()
      this.mutationObserver = null
    }
    if (this.windowResizeHandler && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.windowResizeHandler)
      this.windowResizeHandler = null
    }
  },
  methods: {
    setScrollPosition (axis, value) {
      this.$nextTick(() => {
        const scroller = this.$refs.scroller
        if (!scroller || this.componentDestroyed) return

        const position = Math.max(0, toFiniteNumber(value, 0))
        if (axis === 'top' && scroller.scrollTop !== position) {
          scroller.scrollTop = position
        }
        if (axis === 'left' && scroller.scrollLeft !== position) {
          scroller.scrollLeft = position
        }
      })
    },
    queueScrollIntoView () {
      this.$nextTick(() => this.applyScrollIntoView())
    },
    applyScrollIntoView () {
      const scroller = this.$refs.scroller
      const targetId = this.scrollIntoView
      if (!scroller || !targetId || this.componentDestroyed) return

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
      if (this.scrollY) {
        scroller.scrollTop = Math.max(
          0,
          scroller.scrollTop + targetRect.top - scrollerRect.top
        )
      }
      if (this.scrollX) {
        scroller.scrollLeft = Math.max(
          0,
          scroller.scrollLeft + targetRect.left - scrollerRect.left
        )
      }
    },
    startObservers () {
      const scroller = this.$refs.scroller
      if (!scroller) return

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.syncEdgeState())
        this.resizeObserver.observe(scroller)
      } else if (typeof window !== 'undefined') {
        this.windowResizeHandler = () => this.syncEdgeState()
        window.addEventListener('resize', this.windowResizeHandler)
      }

      if (typeof MutationObserver !== 'undefined') {
        this.mutationObserver = new MutationObserver(() => {
          this.syncEdgeState()
          this.applyScrollIntoView()
        })
        this.mutationObserver.observe(scroller, {
          childList: true,
          subtree: true
        })
      }
    },
    getEdgeState () {
      const scroller = this.$refs.scroller
      if (!scroller) {
        return {
          upperX: false,
          upperY: false,
          lowerX: false,
          lowerY: false
        }
      }

      const upperThreshold = Math.max(0, toFiniteNumber(this.upperThreshold, 50))
      const lowerThreshold = Math.max(0, toFiniteNumber(this.lowerThreshold, 50))
      const canScrollX = this.scrollX && scroller.scrollWidth > scroller.clientWidth + 1
      const canScrollY = this.scrollY && scroller.scrollHeight > scroller.clientHeight + 1

      return {
        upperX: canScrollX && scroller.scrollLeft <= upperThreshold,
        upperY: canScrollY && scroller.scrollTop <= upperThreshold,
        lowerX: canScrollX &&
          scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - lowerThreshold,
        lowerY: canScrollY &&
          scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - lowerThreshold
      }
    },
    syncEdgeState () {
      if (!this.componentDestroyed) {
        this.edgeState = this.getEdgeState()
      }
    },
    buildDetail (scroller, deltaX, deltaY) {
      return {
        scrollLeft: scroller.scrollLeft,
        scrollTop: scroller.scrollTop,
        scrollWidth: scroller.scrollWidth,
        scrollHeight: scroller.scrollHeight,
        deltaX,
        deltaY
      }
    },
    emitScrollEvent (name, detail) {
      this.$emit(name, { detail })
    },
    handleScroll () {
      const scroller = this.$refs.scroller
      if (!scroller || this.componentDestroyed) return

      const deltaX = scroller.scrollLeft - this.lastScrollLeft
      const deltaY = scroller.scrollTop - this.lastScrollTop
      const detail = this.buildDetail(scroller, deltaX, deltaY)
      const nextEdges = this.getEdgeState()

      this.emitScrollEvent('scroll', detail)

      const reachedUpperX = nextEdges.upperX && !this.edgeState.upperX
      const reachedUpperY = nextEdges.upperY && !this.edgeState.upperY
      if (reachedUpperX || reachedUpperY) {
        this.emitScrollEvent('scrolltoupper', {
          ...detail,
          direction: reachedUpperY ? 'top' : 'left'
        })
      }

      const reachedLowerX = nextEdges.lowerX && !this.edgeState.lowerX
      const reachedLowerY = nextEdges.lowerY && !this.edgeState.lowerY
      if (reachedLowerX || reachedLowerY) {
        this.emitScrollEvent('scrolltolower', {
          ...detail,
          direction: reachedLowerY ? 'bottom' : 'right'
        })
      }

      this.edgeState = nextEdges
      this.lastScrollLeft = scroller.scrollLeft
      this.lastScrollTop = scroller.scrollTop
    }
  }
}
</script>

<style>
.analytics-scroll {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
</style>
