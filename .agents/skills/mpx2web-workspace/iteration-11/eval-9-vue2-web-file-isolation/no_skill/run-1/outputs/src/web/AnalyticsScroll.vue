<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    :class="{ 'analytics-scroll--x': scrollX, 'analytics-scroll--y': scrollY }"
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
    lowerThreshold: { type: Number, default: 50 }
  },
  data () {
    return {
      atUpper: false,
      atLower: false
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
      this.setScrollPosition('scrollTop', value)
    },
    scrollLeft (value) {
      this.setScrollPosition('scrollLeft', value)
    },
    scrollIntoView (value) {
      if (value) this.scrollToView(value)
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.setScrollPosition('scrollTop', this.scrollTop)
      this.setScrollPosition('scrollLeft', this.scrollLeft)
      if (this.scrollIntoView) this.scrollToView(this.scrollIntoView)
    })
  },
  methods: {
    setScrollPosition (property, value) {
      const scroller = this.$refs.scroller
      if (!scroller || !Number.isFinite(Number(value))) return
      scroller[property] = Number(value)
    },
    scrollToView (id) {
      this.$nextTick(() => {
        const scroller = this.$refs.scroller
        if (!scroller) return
        const children = scroller.querySelectorAll('[id]')
        for (let index = 0; index < children.length; index += 1) {
          if (children[index].id === id) {
            children[index].scrollIntoView({ block: 'nearest', inline: 'nearest' })
            return
          }
        }
      })
    },
    detail (event) {
      const target = event.target
      return {
        scrollTop: target.scrollTop,
        scrollLeft: target.scrollLeft,
        scrollHeight: target.scrollHeight,
        scrollWidth: target.scrollWidth,
        clientHeight: target.clientHeight,
        clientWidth: target.clientWidth,
        deltaX: event.deltaX || 0,
        deltaY: event.deltaY || 0
      }
    },
    handleScroll (event) {
      const target = event.target
      const detail = this.detail(event)
      this.$emit('scroll', detail)

      const upper = target.scrollTop <= Number(this.upperThreshold || 0)
      const lower = target.scrollTop + target.clientHeight >= target.scrollHeight - Number(this.lowerThreshold || 0)
      if (upper && !this.atUpper) this.$emit('scrolltoupper', detail)
      if (lower && !this.atLower) this.$emit('scrolltolower', detail)
      this.atUpper = upper
      this.atLower = lower
    }
  }
}
</script>

<style scoped>
.analytics-scroll {
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}
</style>
