<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :style="scrollStyle"
    @scroll.passive="handleScroll"
  >
    <div class="analytics-scroll__content">
      <slot />
    </div>
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
    scrollWithAnimation: {
      type: Boolean,
      default: false
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
      reachedUpper: false,
      reachedLower: false
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
      this.setScrollPosition({ top: value })
    },
    scrollLeft (value) {
      this.setScrollPosition({ left: value })
    },
    scrollIntoView (value) {
      this.$nextTick(() => this.scrollToChild(value))
    }
  },
  mounted () {
    this.setScrollPosition({
      top: this.scrollTop,
      left: this.scrollLeft
    })
    this.$nextTick(() => this.scrollToChild(this.scrollIntoView))
  },
  methods: {
    normalizeOffset (value) {
      const number = Number(value)
      return Number.isFinite(number) ? Math.max(0, number) : 0
    },
    setScrollPosition ({ top, left }) {
      const scroller = this.$refs.scroller
      if (!scroller) return

      const nextTop = top === undefined
        ? scroller.scrollTop
        : this.normalizeOffset(top)
      const nextLeft = left === undefined
        ? scroller.scrollLeft
        : this.normalizeOffset(left)

      if (this.scrollWithAnimation && typeof scroller.scrollTo === 'function') {
        scroller.scrollTo({
          top: nextTop,
          left: nextLeft,
          behavior: 'smooth'
        })
      } else {
        scroller.scrollTop = nextTop
        scroller.scrollLeft = nextLeft
      }
    },
    scrollToChild (childId) {
      const scroller = this.$refs.scroller
      if (!scroller || !childId) return

      const childrenWithId = scroller.querySelectorAll('[id]')
      let target = null
      for (let index = 0; index < childrenWithId.length; index += 1) {
        if (childrenWithId[index].id === childId) {
          target = childrenWithId[index]
          break
        }
      }
      if (!target) return

      const scrollerRect = scroller.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      this.setScrollPosition({
        top: this.scrollY
          ? scroller.scrollTop + targetRect.top - scrollerRect.top
          : scroller.scrollTop,
        left: this.scrollX
          ? scroller.scrollLeft + targetRect.left - scrollerRect.left
          : scroller.scrollLeft
      })
    },
    handleScroll () {
      const scroller = this.$refs.scroller
      if (!scroller) return

      const detail = {
        scrollTop: scroller.scrollTop,
        scrollLeft: scroller.scrollLeft,
        scrollHeight: scroller.scrollHeight,
        scrollWidth: scroller.scrollWidth,
        deltaY: scroller.scrollTop - this.previousScrollTop,
        deltaX: scroller.scrollLeft - this.previousScrollLeft
      }

      this.previousScrollTop = scroller.scrollTop
      this.previousScrollLeft = scroller.scrollLeft
      this.$emit('scroll', { detail })
      this.emitBoundaryEvents(detail)
    },
    emitBoundaryEvents (detail) {
      const upperThreshold = this.normalizeOffset(this.upperThreshold)
      const lowerThreshold = this.normalizeOffset(this.lowerThreshold)
      const verticalUpper = this.scrollY && detail.scrollTop <= upperThreshold
      const horizontalUpper = this.scrollX && detail.scrollLeft <= upperThreshold
      const verticalRemaining = detail.scrollHeight - scrollerClientHeight(this.$refs.scroller) - detail.scrollTop
      const horizontalRemaining = detail.scrollWidth - scrollerClientWidth(this.$refs.scroller) - detail.scrollLeft
      const verticalLower = this.scrollY && verticalRemaining <= lowerThreshold
      const horizontalLower = this.scrollX && horizontalRemaining <= lowerThreshold
      const isUpper = verticalUpper || horizontalUpper
      const isLower = verticalLower || horizontalLower

      if (isUpper && !this.reachedUpper) {
        this.$emit('scrolltoupper', { detail })
      }
      if (isLower && !this.reachedLower) {
        this.$emit('scrolltolower', { detail })
      }

      this.reachedUpper = isUpper
      this.reachedLower = isLower
    }
  }
}

function scrollerClientHeight (scroller) {
  return scroller ? scroller.clientHeight : 0
}

function scrollerClientWidth (scroller) {
  return scroller ? scroller.clientWidth : 0
}
</script>

<style>
.analytics-scroll {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.analytics-scroll__content {
  min-width: 100%;
  min-height: 100%;
}
</style>
