<template>
  <div
    ref="scroller"
    v-bind="$attrs"
    class="analytics-scroll"
    :style="scrollStyle"
    @scroll="handleScroll"
  >
    <div ref="content" class="analytics-scroll__content">
      <slot />
    </div>
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
      lastScrollTop: 0,
      lastScrollLeft: 0,
      edgeState: {
        top: false,
        left: false,
        bottom: false,
        right: false
      },
      mutationObserver: null,
      resizeObserver: null,
      intoViewScheduled: false,
      disposed: false
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
      this.syncScrollPosition('scrollTop', value)
    },
    scrollLeft (value) {
      this.syncScrollPosition('scrollLeft', value)
    },
    scrollIntoView () {
      this.scheduleScrollIntoView()
    },
    scrollX () {
      this.scheduleScrollIntoView()
    },
    scrollY () {
      this.scheduleScrollIntoView()
    }
  },
  mounted () {
    this.disposed = false
    this.syncScrollPosition('scrollTop', this.scrollTop)
    this.syncScrollPosition('scrollLeft', this.scrollLeft)
    this.lastScrollTop = this.$refs.scroller.scrollTop
    this.lastScrollLeft = this.$refs.scroller.scrollLeft
    this.setInitialEdgeState()
    this.observeContent()
    this.scheduleScrollIntoView()
  },
  beforeDestroy () {
    this.disposed = true
    if (this.mutationObserver) this.mutationObserver.disconnect()
    if (this.resizeObserver) this.resizeObserver.disconnect()
    this.mutationObserver = null
    this.resizeObserver = null
  },
  methods: {
    toNumber (value, fallback) {
      const number = Number(value)
      return Number.isFinite(number) ? number : fallback
    },
    syncScrollPosition (property, value) {
      this.$nextTick(() => {
        if (this.disposed || !this.$refs.scroller) return
        const position = Math.max(0, this.toNumber(value, 0))
        if (this.$refs.scroller[property] !== position) {
          this.$refs.scroller[property] = position
        }
        this.lastScrollTop = this.$refs.scroller.scrollTop
        this.lastScrollLeft = this.$refs.scroller.scrollLeft
      })
    },
    observeContent () {
      const scroller = this.$refs.scroller
      const content = this.$refs.content

      if (typeof MutationObserver !== 'undefined') {
        this.mutationObserver = new MutationObserver(() => this.scheduleScrollIntoView())
        this.mutationObserver.observe(content, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ['id', 'class', 'style']
        })
      }

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.scheduleScrollIntoView())
        this.resizeObserver.observe(scroller)
        this.resizeObserver.observe(content)
      }
    },
    scheduleScrollIntoView () {
      if (this.intoViewScheduled || this.disposed) return
      this.intoViewScheduled = true
      this.$nextTick(() => {
        this.intoViewScheduled = false
        if (!this.disposed) this.applyScrollIntoView()
      })
    },
    applyScrollIntoView () {
      const id = this.scrollIntoView == null ? '' : String(this.scrollIntoView)
      const scroller = this.$refs.scroller
      const content = this.$refs.content
      if (!id || !scroller || !content) return

      const nodes = content.querySelectorAll('[id]')
      let target = null
      for (let index = 0; index < nodes.length; index += 1) {
        if (nodes[index].id === id) {
          target = nodes[index]
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
    createScrollDetail (scroller, deltaX, deltaY) {
      return {
        scrollTop: scroller.scrollTop,
        scrollLeft: scroller.scrollLeft,
        scrollHeight: scroller.scrollHeight,
        scrollWidth: scroller.scrollWidth,
        deltaX,
        deltaY
      }
    },
    createEvent (type, detail) {
      const scroller = this.$refs.scroller
      return {
        type,
        target: scroller,
        currentTarget: scroller,
        detail
      }
    },
    handleScroll () {
      const scroller = this.$refs.scroller
      if (!scroller) return

      const deltaX = scroller.scrollLeft - this.lastScrollLeft
      const deltaY = scroller.scrollTop - this.lastScrollTop
      this.lastScrollLeft = scroller.scrollLeft
      this.lastScrollTop = scroller.scrollTop

      const detail = this.createScrollDetail(scroller, deltaX, deltaY)
      this.$emit('scroll', this.createEvent('scroll', detail))
      this.emitEdgeEvents(scroller, detail)
    },
    getEdgeState (scroller) {
      const upper = Math.max(0, this.toNumber(this.upperThreshold, 50))
      const lower = Math.max(0, this.toNumber(this.lowerThreshold, 50))
      const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
      const maxLeft = Math.max(0, scroller.scrollWidth - scroller.clientWidth)

      return {
        top: this.scrollY && scroller.scrollTop <= upper,
        left: this.scrollX && scroller.scrollLeft <= upper,
        bottom: this.scrollY && maxTop > 0 && maxTop - scroller.scrollTop <= lower,
        right: this.scrollX && maxLeft > 0 && maxLeft - scroller.scrollLeft <= lower
      }
    },
    setInitialEdgeState () {
      if (this.$refs.scroller) this.edgeState = this.getEdgeState(this.$refs.scroller)
    },
    emitEdgeEvents (scroller, scrollDetail) {
      const nextState = this.getEdgeState(scroller)
      const upperDirections = ['top', 'left']
      const lowerDirections = ['bottom', 'right']

      upperDirections.forEach((direction) => {
        if (nextState[direction] && !this.edgeState[direction]) {
          const detail = Object.assign({}, scrollDetail, { direction })
          this.$emit('scrolltoupper', this.createEvent('scrolltoupper', detail))
        }
      })
      lowerDirections.forEach((direction) => {
        if (nextState[direction] && !this.edgeState[direction]) {
          const detail = Object.assign({}, scrollDetail, { direction })
          this.$emit('scrolltolower', this.createEvent('scrolltolower', detail))
        }
      })

      this.edgeState = nextState
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
}
</style>
