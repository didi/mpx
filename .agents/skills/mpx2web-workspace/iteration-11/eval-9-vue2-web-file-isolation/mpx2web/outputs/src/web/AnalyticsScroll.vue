<template>
  <div
    ref="scrollElement"
    class="analytics-scroll"
    :style="scrollStyle"
    v-bind="$attrs"
    @scroll.passive="handleNativeScroll"
  >
    <slot />
  </div>
</template>

<script>
export default {
  name: 'AnalyticsScroll',
  inheritAttrs: false,
  props: {
    scrollX: { type: Boolean, default: false },
    scrollY: { type: Boolean, default: false },
    scrollTop: { type: [Number, String], default: 0 },
    scrollLeft: { type: [Number, String], default: 0 },
    scrollIntoView: { type: String, default: '' },
    upperThreshold: { type: [Number, String], default: 50 },
    lowerThreshold: { type: [Number, String], default: 50 }
  },
  data () {
    return {
      previousTop: 0,
      previousLeft: 0,
      pendingTop: false,
      pendingLeft: false,
      scrollFrame: null,
      resizeObserver: null,
      mutationObserver: null,
      edgeState: {
        upperTop: false,
        upperLeft: false,
        lowerBottom: false,
        lowerRight: false
      }
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
      this.pendingTop = true
      this.scheduleControlledPosition()
    },
    scrollLeft () {
      this.pendingLeft = true
      this.scheduleControlledPosition()
    },
    scrollX () {
      this.pendingLeft = this.scrollX
      this.scheduleControlledPosition()
    },
    scrollY () {
      this.pendingTop = this.scrollY
      this.scheduleControlledPosition()
    },
    scrollIntoView () {
      this.scheduleScrollIntoView()
    }
  },
  mounted () {
    this.pendingTop = this.scrollY
    this.pendingLeft = this.scrollX
    this.syncControlledPosition()
    this.primeBoundaryState()
    this.startObservers()
    this.scheduleScrollIntoView()
  },
  updated () {
    this.scheduleScrollIntoView()
  },
  beforeDestroy () {
    if (this.scrollFrame !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.scrollFrame)
    }
    this.scrollFrame = null

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
    toNumber (value, fallback) {
      const number = Number(value)
      return Number.isFinite(number) ? number : fallback
    },
    scheduleControlledPosition () {
      this.$nextTick(() => this.syncControlledPosition())
    },
    syncControlledPosition () {
      const element = this.$refs.scrollElement
      if (!element) return

      if (this.scrollY) element.scrollTop = this.toNumber(this.scrollTop, 0)
      if (this.scrollX) element.scrollLeft = this.toNumber(this.scrollLeft, 0)
      this.pendingTop = this.scrollY && Math.abs(element.scrollTop - this.toNumber(this.scrollTop, 0)) > 1
      this.pendingLeft = this.scrollX && Math.abs(element.scrollLeft - this.toNumber(this.scrollLeft, 0)) > 1
    },
    startObservers () {
      const element = this.$refs.scrollElement
      if (!element) return

      if (typeof MutationObserver !== 'undefined') {
        this.mutationObserver = new MutationObserver(() => {
          this.observeResizeTargets()
          if (this.pendingTop || this.pendingLeft) this.scheduleControlledPosition()
          this.scheduleScrollIntoView()
        })
        this.mutationObserver.observe(element, {
          childList: true,
          subtree: true,
          characterData: true
        })
      }

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.scheduleScrollIntoView())
        this.observeResizeTargets()
      }
    },
    observeResizeTargets () {
      const element = this.$refs.scrollElement
      if (!this.resizeObserver || !element) return

      this.resizeObserver.disconnect()
      this.resizeObserver.observe(element)
      Array.prototype.forEach.call(element.children, (child) => {
        this.resizeObserver.observe(child)
      })
    },
    refresh () {
      this.observeResizeTargets()
      this.scheduleScrollIntoView()
    },
    scheduleScrollIntoView () {
      if (!this.scrollIntoView) return

      this.$nextTick(() => {
        if (!this.$refs.scrollElement) return
        if (this.scrollFrame !== null && typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(this.scrollFrame)
        }

        if (typeof requestAnimationFrame === 'function') {
          this.scrollFrame = requestAnimationFrame(() => {
            this.scrollFrame = null
            this.applyScrollIntoView()
          })
        } else {
          this.applyScrollIntoView()
        }
      })
    },
    applyScrollIntoView () {
      const element = this.$refs.scrollElement
      if (!element || !this.scrollIntoView) return

      const id = String(this.scrollIntoView)
      const nodes = element.querySelectorAll('[id]')
      let target = null
      for (let index = 0; index < nodes.length; index += 1) {
        if (nodes[index].id === id) {
          target = nodes[index]
          break
        }
      }
      if (!target) return

      const containerRect = element.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      if (this.scrollY) {
        element.scrollTop += targetRect.top - containerRect.top
      }
      if (this.scrollX) {
        element.scrollLeft += targetRect.left - containerRect.left
      }
    },
    createEvent (type, detail, originalEvent) {
      const element = this.$refs.scrollElement
      return {
        type,
        timeStamp: originalEvent ? originalEvent.timeStamp : Date.now(),
        target: element,
        currentTarget: element,
        detail,
        originalEvent: originalEvent || null
      }
    },
    currentDetail (element, deltaX, deltaY) {
      return {
        scrollTop: element.scrollTop,
        scrollLeft: element.scrollLeft,
        scrollHeight: element.scrollHeight,
        scrollWidth: element.scrollWidth,
        deltaX,
        deltaY
      }
    },
    primeBoundaryState () {
      const element = this.$refs.scrollElement
      if (!element) return

      const upper = Math.max(0, this.toNumber(this.upperThreshold, 50))
      const lower = Math.max(0, this.toNumber(this.lowerThreshold, 50))
      const maxTop = Math.max(0, element.scrollHeight - element.clientHeight)
      const maxLeft = Math.max(0, element.scrollWidth - element.clientWidth)
      this.edgeState.upperTop = this.scrollY && element.scrollTop <= upper
      this.edgeState.upperLeft = this.scrollX && element.scrollLeft <= upper
      this.edgeState.lowerBottom = this.scrollY && maxTop > 0 && maxTop - element.scrollTop <= lower
      this.edgeState.lowerRight = this.scrollX && maxLeft > 0 && maxLeft - element.scrollLeft <= lower
    },
    handleNativeScroll (event) {
      const element = event.currentTarget
      const deltaX = element.scrollLeft - this.previousLeft
      const deltaY = element.scrollTop - this.previousTop
      this.previousLeft = element.scrollLeft
      this.previousTop = element.scrollTop

      const detail = this.currentDetail(element, deltaX, deltaY)
      this.$emit('scroll', this.createEvent('scroll', detail, event))
      this.emitBoundaryEvents(element, detail, event)
    },
    updateBoundary (stateKey, active, eventName, direction, detail, originalEvent) {
      if (!active) {
        this.edgeState[stateKey] = false
        return
      }
      if (this.edgeState[stateKey]) return

      this.edgeState[stateKey] = true
      this.$emit(
        eventName,
        this.createEvent(eventName, { ...detail, direction }, originalEvent)
      )
    },
    emitBoundaryEvents (element, detail, originalEvent) {
      const upper = Math.max(0, this.toNumber(this.upperThreshold, 50))
      const lower = Math.max(0, this.toNumber(this.lowerThreshold, 50))
      const maxTop = Math.max(0, element.scrollHeight - element.clientHeight)
      const maxLeft = Math.max(0, element.scrollWidth - element.clientWidth)

      this.updateBoundary(
        'upperTop',
        this.scrollY && element.scrollTop <= upper,
        'scrolltoupper',
        'top',
        detail,
        originalEvent
      )
      this.updateBoundary(
        'upperLeft',
        this.scrollX && element.scrollLeft <= upper,
        'scrolltoupper',
        'left',
        detail,
        originalEvent
      )
      this.updateBoundary(
        'lowerBottom',
        this.scrollY && maxTop > 0 && maxTop - element.scrollTop <= lower,
        'scrolltolower',
        'bottom',
        detail,
        originalEvent
      )
      this.updateBoundary(
        'lowerRight',
        this.scrollX && maxLeft > 0 && maxLeft - element.scrollLeft <= lower,
        'scrolltolower',
        'right',
        detail,
        originalEvent
      )
    }
  }
}
</script>

<style scoped>
.analytics-scroll {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}
</style>
