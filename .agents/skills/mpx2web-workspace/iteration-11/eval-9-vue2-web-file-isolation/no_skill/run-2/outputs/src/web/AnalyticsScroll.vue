<script>
export default {
  name: 'AnalyticsScroll',
  inheritAttrs: false,
  props: {
    scrollY: Boolean,
    scrollX: Boolean,
    scrollTop: [Number, String],
    scrollLeft: [Number, String],
    scrollIntoView: String,
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
      lastScrollTop: 0,
      lastScrollLeft: 0,
      atUpper: false,
      atLower: false
    }
  },
  computed: {
    scrollStyle () {
      return {
        overflowX: this.scrollX ? 'auto' : 'hidden',
        overflowY: this.scrollY ? 'auto' : 'hidden',
        WebkitOverflowScrolling: 'touch'
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
    scrollIntoView () {
      this.$nextTick(this.scrollToChild)
    }
  },
  mounted () {
    this.setScrollPosition('scrollTop', this.scrollTop)
    this.setScrollPosition('scrollLeft', this.scrollLeft)
    this.scrollToChild()
  },
  methods: {
    setScrollPosition (property, value) {
      if (value === undefined || value === '') return
      this.$refs.scroller[property] = Number(value)
    },
    scrollToChild () {
      if (!this.scrollIntoView) return
      const child = this.$refs.scroller.ownerDocument.getElementById(this.scrollIntoView)
      if (child && this.$refs.scroller.contains(child)) child.scrollIntoView()
    },
    createEvent (type, event, detail) {
      return {
        type,
        target: event.target,
        currentTarget: event.currentTarget,
        timeStamp: event.timeStamp,
        detail,
        originalEvent: event
      }
    },
    handleScroll (event) {
      const target = event.target
      const scrollTop = target.scrollTop
      const scrollLeft = target.scrollLeft
      const detail = {
        scrollTop,
        scrollLeft,
        scrollHeight: target.scrollHeight,
        scrollWidth: target.scrollWidth,
        deltaX: scrollLeft - this.lastScrollLeft,
        deltaY: scrollTop - this.lastScrollTop
      }
      const upper = scrollTop <= Number(this.upperThreshold)
      const lower = scrollTop + target.clientHeight >= target.scrollHeight - Number(this.lowerThreshold)

      this.$emit('scroll', this.createEvent('scroll', event, detail))
      if (upper && !this.atUpper) {
        this.$emit('scrolltoupper', this.createEvent('scrolltoupper', event, {
          direction: 'top'
        }))
      }
      if (lower && !this.atLower) {
        this.$emit('scrolltolower', this.createEvent('scrolltolower', event, {
          direction: 'bottom'
        }))
      }

      this.atUpper = upper
      this.atLower = lower
      this.lastScrollTop = scrollTop
      this.lastScrollLeft = scrollLeft
    }
  },
  render (createElement) {
    const listeners = Object.assign({}, this.$listeners, {
      scroll: this.handleScroll
    })
    const children = []

    Object.keys(this.$slots).forEach((name) => {
      this.$slots[name].forEach((node) => children.push(node))
    })
    Object.keys(this.$scopedSlots).forEach((name) => {
      if (!this.$slots[name] && typeof this.$scopedSlots[name] === 'function') {
        const nodes = this.$scopedSlots[name]({})
        if (nodes) nodes.forEach((node) => children.push(node))
      }
    })

    return createElement('div', {
      ref: 'scroller',
      staticClass: 'analytics-scroll',
      attrs: this.$attrs,
      style: this.scrollStyle,
      on: listeners
    }, children)
  }
}
</script>

<style scoped>
.analytics-scroll {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}
</style>
