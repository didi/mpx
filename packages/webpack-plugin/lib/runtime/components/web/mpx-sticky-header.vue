<script>
import { getCustomEvent } from './getInnerListeners'

export default {
  name: 'mpx-sticky-header',
  inject: ['scrollOffset'],
  props: {
    'offsetTop': {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      headerTop: 0,
      isStickOnTop: false
    }
  },
  computed: {
    _scrollOffset () {
      return -this.scrollOffset?.get() || 0
    }
  },
  mounted () {
    if (!this.$parent?.$refs?.wrapper) {
      console.error('[Mpx runtime error]: sticky-header must be placed inside a scroll-view component')
      return
    }
    const rect = this.$el.getBoundingClientRect()
    const scrollViewRect = this.$parent.$refs.wrapper.getBoundingClientRect()
    this.headerTop = rect.top - scrollViewRect.top - this.offsetTop
  },
  watch: {
    _scrollOffset: {
      handler (newScrollOffset) {
        const newIsStickOnTop = newScrollOffset > this.headerTop
        
        if (newIsStickOnTop !== this.isStickOnTop) {
          this.isStickOnTop = newIsStickOnTop
          this.$emit('stickontopchange', getCustomEvent('stickontopchange', {
            isStickOnTop: newIsStickOnTop
          }, this))
        }
      },
      immediate: true
    }
  },
  render (h) {
    const style = {
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      transform: this.isStickOnTop ? `translateY(${this._scrollOffset - this.headerTop + this.offsetTop}px)` : 'none'
    }

    return h('div', {
      style
    }, this.$slots.default)
  }
}
</script>