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
    scrollX: { type: Boolean, default: false },
    scrollY: { type: Boolean, default: false },
    scrollTop: { type: Number, default: 0 },
    scrollLeft: { type: Number, default: 0 },
    scrollIntoView: { type: String, default: '' },
    upperThreshold: { type: Number, default: 50 },
    lowerThreshold: { type: Number, default: 50 },
    scrollWithAnimation: { type: Boolean, default: false }
  },
  data () {
    return {
      upperReached: Object.create(null),
      lowerReached: Object.create(null),
      previousLeft: 0,
      previousTop: 0
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
    scrollTop () { this.syncPosition() },
    scrollLeft () { this.syncPosition() },
    scrollIntoView () { this.scrollToTarget() }
  },
  mounted () {
    this.$nextTick(() => {
      this.syncPosition()
      this.scrollToTarget()
    })
  },
  methods: {
    syncPosition () {
      this.$nextTick(() => {
        const scroller = this.$refs.scroller
        if (!scroller) return
        const behavior = this.scrollWithAnimation ? 'smooth' : 'auto'
        scroller.scrollTo({
          left: this.scrollX ? Number(this.scrollLeft) || 0 : scroller.scrollLeft,
          top: this.scrollY ? Number(this.scrollTop) || 0 : scroller.scrollTop,
          behavior
        })
      })
    },
    scrollToTarget () {
      this.$nextTick(() => {
        const scroller = this.$refs.scroller
        const targetId = this.scrollIntoView
        if (!scroller || !targetId) return
        const target = Array.prototype.find.call(scroller.querySelectorAll('[id]'), (node) => node.id === targetId)
        if (!target) return
        const left = target.offsetLeft - scroller.offsetLeft
        const top = target.offsetTop - scroller.offsetTop
        scroller.scrollTo({ left, top, behavior: this.scrollWithAnimation ? 'smooth' : 'auto' })
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
        deltaX: scroller.scrollLeft - this.previousLeft,
        deltaY: scroller.scrollTop - this.previousTop
      }
      this.previousLeft = scroller.scrollLeft
      this.previousTop = scroller.scrollTop
      this.$emit('scroll', detail)
      this.emitEdges(scroller, detail)
    },
    emitEdges (scroller, detail) {
      const upperThreshold = Number(this.upperThreshold) || 0
      const lowerThreshold = Number(this.lowerThreshold) || 0
      const directions = []
      if (this.scrollY) {
        directions.push({ name: 'top', upper: scroller.scrollTop <= upperThreshold, lower: scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - lowerThreshold })
      }
      if (this.scrollX) {
        directions.push({ name: 'left', upper: scroller.scrollLeft <= upperThreshold, lower: scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - lowerThreshold })
      }
      directions.forEach(({ name, upper, lower }) => {
        if (upper && !this.upperReached[name]) this.$emit('scrolltoupper', Object.assign({ direction: name }, detail))
        if (lower && !this.lowerReached[name]) this.$emit('scrolltolower', Object.assign({ direction: name === 'top' ? 'bottom' : 'right' }, detail))
        this.upperReached[name] = upper
        this.lowerReached[name] = lower
      })
    }
  }
}
</script>

<style scoped>
.analytics-scroll {
  box-sizing: border-box;
  height: 100%;
  width: 100%;
}
</style>
