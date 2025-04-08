<script>
  import { getCustomEvent } from './getInnerListeners'

  export default {
    name: 'mpx-sticky-header',
    inject: ['scrollOffset', 'scrollViewRect'],
    props: {
      'offsetTop': {
        type: Number,
        default: 0
      }
    },
    data() {
      return {
        headerTop: 0,
        isStickOnTop: false,
        headerRect: {}
      }
    },
    computed: {
      _scrollOffset() {
        return -this.scrollOffset?.get() || 0
      },
      _scrollViewRect() {
        return this.scrollViewRect?.get() || {}
      }
    },
    mounted() {
      this.headerRect = this.$el.getBoundingClientRect()
      this.headerTop = this.headerRect.top - (this._scrollViewRect.top || 0) - this.offsetTop
    },
    watch: {
      _scrollOffset: {
        handler(newScrollOffset) {
          const newIsStickOnTop = newScrollOffset > this.headerTop

          if (newIsStickOnTop !== this.isStickOnTop) {
            this.isStickOnTop = newIsStickOnTop
            this.$emit('stickontopchange', getCustomEvent('stickontopchange', {
              isStickOnTop: newIsStickOnTop
            }, this))
          }
          
          const stickyHeader = this.$refs.stickyHeader
          if (!stickyHeader) return
          if (this.isStickOnTop) {
            stickyHeader.style.transform = `translateY(${newScrollOffset - this.headerTop + this.offsetTop}px)`
          } else {
            stickyHeader.style.transform = 'none'
          }
        },
        immediate: true
      },
      _scrollViewRect: {
        handler(rect = {}) {
          this.headerTop = this.headerRect.top - (rect.top || 0) - this.offsetTop
        },
      }
    },
    render(h) {
      const style = {
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative'
      }

      return h('div', {
        style,
        ref: 'stickyHeader'
      }, this.$slots.default)
    }
  }
</script>