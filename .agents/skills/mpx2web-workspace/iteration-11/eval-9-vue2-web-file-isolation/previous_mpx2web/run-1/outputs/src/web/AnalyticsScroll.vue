<template>
  <div
    ref="viewport"
    class="analytics-scroll"
    :style="overflowStyle"
    @scroll.passive="handleScroll"
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
    },
    scrollWithAnimation: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      previousScrollTop: 0,
      previousScrollLeft: 0,
      upperInside: false,
      lowerInside: false
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
      this.queuePositionSync()
    },
    scrollLeft () {
      this.queuePositionSync()
    },
    scrollIntoView () {
      this.queueIntoView()
    }
  },
  mounted () {
    this.observersDetached = false
    this.positionQueued = false
    this.intoViewQueued = false
    this.mutationObserver = null
    this.resizeObserver = null

    this.$nextTick(() => {
      if (this.observersDetached) return
      this.syncPosition()
      this.scrollTargetIntoView()
      this.installObservers()
    })
  },
  beforeDestroy () {
    this.observersDetached = true

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
    normalizeNumber (value, fallback = 0) {
      const number = Number(value)
      return Number.isFinite(number) ? number : fallback
    },
    setScrollPosition (left, top) {
      const viewport = this.$refs.viewport
      if (!viewport) return

      const nextLeft = Math.max(0, this.normalizeNumber(left))
      const nextTop = Math.max(0, this.normalizeNumber(top))

      if (typeof viewport.scrollTo === 'function') {
        try {
          viewport.scrollTo({
            left: nextLeft,
            top: nextTop,
            behavior: this.scrollWithAnimation ? 'smooth' : 'auto'
          })
          return
        } catch {
          // Older browsers do not accept the object form of scrollTo.
        }
      }

      viewport.scrollLeft = nextLeft
      viewport.scrollTop = nextTop
    },
    syncPosition () {
      this.setScrollPosition(this.scrollLeft, this.scrollTop)
    },
    queuePositionSync () {
      if (this.positionQueued) return
      this.positionQueued = true
      this.$nextTick(() => {
        this.positionQueued = false
        if (!this.observersDetached) this.syncPosition()
      })
    },
    findTarget (id) {
      const viewport = this.$refs.viewport
      if (!viewport || !id) return null

      const candidates = viewport.querySelectorAll('[id]')
      for (let index = 0; index < candidates.length; index += 1) {
        if (candidates[index].id === id) return candidates[index]
      }
      return null
    },
    scrollTargetIntoView () {
      const viewport = this.$refs.viewport
      const target = this.findTarget(this.scrollIntoView)
      if (!viewport || !target) return

      const viewportRect = viewport.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      const left = this.scrollX
        ? viewport.scrollLeft + targetRect.left - viewportRect.left
        : viewport.scrollLeft
      const top = this.scrollY
        ? viewport.scrollTop + targetRect.top - viewportRect.top
        : viewport.scrollTop

      this.setScrollPosition(left, top)
    },
    queueIntoView () {
      if (this.intoViewQueued) return
      this.intoViewQueued = true
      this.$nextTick(() => {
        this.intoViewQueued = false
        if (!this.observersDetached) this.scrollTargetIntoView()
      })
    },
    installObservers () {
      const viewport = this.$refs.viewport
      const ownerWindow = viewport && viewport.ownerDocument && viewport.ownerDocument.defaultView
      if (!viewport || !ownerWindow) return

      if (ownerWindow.MutationObserver) {
        this.mutationObserver = new ownerWindow.MutationObserver(() => this.queueIntoView())
        this.mutationObserver.observe(viewport, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['id']
        })
      }

      if (ownerWindow.ResizeObserver) {
        this.resizeObserver = new ownerWindow.ResizeObserver(() => this.queueIntoView())
        this.resizeObserver.observe(viewport)
        Array.prototype.forEach.call(viewport.children, (child) => this.resizeObserver.observe(child))
      }
    },
    handleScroll () {
      const viewport = this.$refs.viewport
      if (!viewport) return

      const detail = {
        scrollLeft: viewport.scrollLeft,
        scrollTop: viewport.scrollTop,
        scrollWidth: viewport.scrollWidth,
        scrollHeight: viewport.scrollHeight,
        deltaX: viewport.scrollLeft - this.previousScrollLeft,
        deltaY: viewport.scrollTop - this.previousScrollTop
      }

      this.previousScrollLeft = detail.scrollLeft
      this.previousScrollTop = detail.scrollTop
      this.$emit('scroll', { detail })
      this.emitBoundaryEvents(detail)
    },
    emitBoundaryEvents (detail) {
      const viewport = this.$refs.viewport
      const upperThreshold = Math.max(0, this.normalizeNumber(this.upperThreshold, 50))
      const lowerThreshold = Math.max(0, this.normalizeNumber(this.lowerThreshold, 50))
      const upperDirections = []
      const lowerDirections = []

      if (this.scrollY) {
        if (detail.scrollTop <= upperThreshold) upperDirections.push('top')
        if (viewport.scrollHeight - viewport.clientHeight - detail.scrollTop <= lowerThreshold) {
          lowerDirections.push('bottom')
        }
      }

      if (this.scrollX) {
        if (detail.scrollLeft <= upperThreshold) upperDirections.push('left')
        if (viewport.scrollWidth - viewport.clientWidth - detail.scrollLeft <= lowerThreshold) {
          lowerDirections.push('right')
        }
      }

      const isUpperInside = upperDirections.length > 0
      const isLowerInside = lowerDirections.length > 0

      if (isUpperInside && !this.upperInside) {
        this.$emit('scrolltoupper', {
          detail: { ...detail, direction: upperDirections[0] }
        })
      }

      if (isLowerInside && !this.lowerInside) {
        this.$emit('scrolltolower', {
          detail: { ...detail, direction: lowerDirections[0] }
        })
      }

      this.upperInside = isUpperInside
      this.lowerInside = isLowerInside
    }
  }
}
</script>

<style>
.analytics-scroll {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
</style>
