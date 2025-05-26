<script>
import { warn } from '@mpxjs/utils'
import { getCustomEvent } from './getInnerListeners'

  export default {
    name: 'mpx-sticky-header',
    inject: ['scrollOffset', 'refreshVersion'],
    props: {
      offsetTop: {
        type: Number,
        default: 0
      },
      padding: Array
    },
    data() {
      return {
        headerTop: 0,
        isStickOnTop: false
      }
    },
    watch: {
      scrollOffset: {
        handler(newScrollOffset) {
          const newIsStickOnTop = newScrollOffset > this.headerTop
          if (newIsStickOnTop !== this.isStickOnTop) {
            this.isStickOnTop = newIsStickOnTop
            this.$emit('stickontopchange', getCustomEvent('stickontopchange', {
              isStickOnTop: newIsStickOnTop
            }, this))
          }

          this.setTransformStyle()
        },
        immediate: true
      },
      refreshVersion: {
        handler() {
          const parentElement = this.$el.parentElement
          if (!parentElement) return
          
          const parentClass = parentElement.className || ''
          const isStickySection = /mpx-sticky-section/.test(parentClass)
          const isScrollViewWrapper = /mpx-inner-wrapper/.test(parentClass)
          
          if (!isStickySection && !isScrollViewWrapper) {
            warn('sticky-header only supports being a direct child of a scroll-view or sticky-section component.')
            return
          }
          
          this.headerTop = isStickySection 
            ? this.$el.offsetTop + parentElement.offsetTop
            : this.$el.offsetTop
          
          this.setTransformStyle()
        },
      }
    },
    mounted() {
      this.setPaddingStyle()
    },
    methods: {
      setPaddingStyle() {
        const stickyHeader = this.$refs.stickyHeader
        if (!stickyHeader) return
        
        if (this.padding && Array.isArray(this.padding)) {
          const [top = 0, right = 0, bottom = 0, left = 0] = this.padding
          stickyHeader.style.padding = `${top}px ${right}px ${bottom}px ${left}px`
        }
      },
      setTransformStyle () {
        const stickyHeader = this.$refs.stickyHeader
        if (!stickyHeader) return
        
        // 设置 transform
        if (this.scrollOffset > this.headerTop) {
          stickyHeader.style.transform = `translateY(${this.scrollOffset - this.headerTop + this.offsetTop}px)`
        } else {
          stickyHeader.style.transform = 'none'
        }
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