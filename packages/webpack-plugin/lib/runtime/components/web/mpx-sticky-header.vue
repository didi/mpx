<script>
import { warn } from '@mpxjs/utils'
import { getCustomEvent } from './getInnerListeners'

  export default {
    name: 'mpx-sticky-header',
    inject: ['scrollOffset', 'refreshVersion'],
    props: {
      'offsetTop': {
        type: Number,
        default: 0
      }
    },
    data() {
      return {
        headerTop: 0,
        isStickOnTop: false
      }
    },
    computed: {
      _scrollOffset() {
        return -this.scrollOffset?.get() || 0
      },
      _refreshVersion() {
        return this.refreshVersion?.get() || 0
      }
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
      _refreshVersion: {
        handler() {
          const parentElement = this.$el.parentElement || {}
          if (parentElement.className?.indexOf('mpx-sticky-section') > -1) {
            this.headerTop = this.$el.offsetTop + this.$el.parentElement.offsetTop
          } else if (parentElement.className?.indexOf('mpx-inner-wrapper') > -1) {
             this.headerTop = this.$el.offsetTop
          } else {
            warn('sticky-header only supports being a direct child of a scroll-view or sticky-section component.')
            return
          }
          const stickyHeader = this.$refs.stickyHeader
          if (this._scrollOffset > this.headerTop) {
            stickyHeader.style.transform = `translateY(${this._scrollOffset - this.headerTop + this.offsetTop}px)`
          } else {
            stickyHeader.style.transform = 'none'
          }
        },
      }
    },
    render(h) {
      const style = {
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10
      }

      return h('div', {
        style,
        ref: 'stickyHeader'
      }, this.$slots.default)
    }
  }
</script>