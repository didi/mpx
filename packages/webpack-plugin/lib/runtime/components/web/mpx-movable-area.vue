<template>
  <div class="mpx-movable-area-container" ref="movableArea">
    <div class="mpx-movable-scroll-wrapper" ref="scroll">
      <slot></slot>
    </div>
  </div>
</template>

<script type="text/ecmascript-6">
  export default {
    data() {
      return {
        isInited: false,
      }
    },
    mounted() {
      // 延迟计算样式，确保子元素已经渲染完成
      this.$nextTick(() => {
        this.computedStyle()
        if (!this.closeResizeObserver) {
          this.createResizeObserver()
        }
      })
    },
    methods: {
      computedStyle() {
        const element = this.$refs.movableArea
        const style = element.getBoundingClientRect()
        const computedStyle = window.getComputedStyle(element)
        
        // 检查是否显式设置了宽度
        if (!style.width) {
          this.setAutoWidth(element)
        }
        
        // 检查是否显式设置了高度
        if (!style.height) {
          this.setAutoHeight(element)
        }
      },
      
      setAutoWidth(element) {
        const scrollWrapper = this.$refs.scroll
        if (!scrollWrapper) return
        
        let maxWidth = 0
        
        // 遍历所有子元素，计算最大宽度
        Array.from(scrollWrapper.children).forEach(child => {
          const childStyle = window.getComputedStyle(child)
          const childRect = child.getBoundingClientRect()
          
          if (childStyle.position === 'absolute' || childStyle.position === 'fixed') {
            // 对于绝对定位的元素，计算其右边界
            const left = parseFloat(childStyle.left) || 0
            const right = parseFloat(childStyle.right)
            const width = childRect.width || 0
            
            if (!isNaN(right)) {
              // 如果设置了 right，从容器宽度减去 right 值
              const containerWidth = element.getBoundingClientRect().width || 0
              maxWidth = Math.max(maxWidth, containerWidth - right)
            } else {
              maxWidth = Math.max(maxWidth, left + width)
            }
          } else {
            // 对于普通元素，使用其 offsetWidth 包含 margin
            const marginLeft = parseFloat(childStyle.marginLeft) || 0
            const marginRight = parseFloat(childStyle.marginRight) || 0
            maxWidth = Math.max(maxWidth, child.offsetWidth + marginLeft + marginRight)
          }
        })
        
        // 如果没有内容或内容宽度为0，保持原有宽度或设置最小宽度
        if (maxWidth > 0) {
          element.style.width = Math.ceil(maxWidth) + 'px'
        }
      },
      
      setAutoHeight(element) {
        const scrollWrapper = this.$refs.scroll
        if (!scrollWrapper) return
        
        let maxHeight = 0
        
        // 遍历所有子元素，计算最大高度
        Array.from(scrollWrapper.children).forEach(child => {
          const childStyle = window.getComputedStyle(child)
          const childRect = child.getBoundingClientRect()
          
          if (childStyle.position === 'absolute' || childStyle.position === 'fixed') {
            // 对于绝对定位的元素，计算其底边界
            const top = parseFloat(childStyle.top) || 0
            const bottom = parseFloat(childStyle.bottom)
            const height = childRect.height || 0
            
            if (!isNaN(bottom)) {
              // 如果设置了 bottom，从容器高度减去 bottom 值
              const containerHeight = element.getBoundingClientRect().height || 0
              maxHeight = Math.max(maxHeight, containerHeight - bottom)
            } else {
              maxHeight = Math.max(maxHeight, top + height)
            }
          } else {
            // 对于普通元素，使用其 offsetHeight 包含 margin
            const marginTop = parseFloat(childStyle.marginTop) || 0
            const marginBottom = parseFloat(childStyle.marginBottom) || 0
            maxHeight = Math.max(maxHeight, child.offsetHeight + marginTop + marginBottom)
          }
        })
        
        // 如果没有内容或内容高度为0，保持原有高度或设置最小高度
        if (maxHeight > 0) {
          element.style.height = Math.ceil(maxHeight) + 'px'
        }
      },
      createResizeObserver() {
        if (typeof ResizeObserver !== 'undefined') {
          this.resizeObserver = new ResizeObserver(entries => {
            if (!this.isInited) {
              this.isInited = true
              return
            }
            // 当尺寸变化时，重新计算样式
            this.computedStyle()
            this.$children.forEach(child => {
              if (child && child.refresh) {
                child.refresh()
              }
            })
          })
          this.resizeObserver.observe(this.$refs.movableArea)
          
          // 同时观察滚动容器的变化
          if (this.$refs.scroll) {
            this.resizeObserver.observe(this.$refs.scroll)
          }
        }
        
        // 创建 MutationObserver 来监听子元素的变化
        this.createMutationObserver()
      },
      
      createMutationObserver() {
        if (typeof MutationObserver !== 'undefined') {
          this.mutationObserver = new MutationObserver(mutations => {
            let shouldRecompute = false
            
            mutations.forEach(mutation => {
              // 检查是否有子元素的添加、删除或属性变化
              if (mutation.type === 'childList' || 
                  (mutation.type === 'attributes' && 
                   ['style', 'class'].includes(mutation.attributeName))) {
                shouldRecompute = true
              }
            })
            
            if (shouldRecompute) {
              // 延迟重新计算，避免频繁计算
              clearTimeout(this.recomputeTimer)
              this.recomputeTimer = setTimeout(() => {
                this.computedStyle()
              }, 100)
            }
          })
          
          if (this.$refs.scroll) {
            this.mutationObserver.observe(this.$refs.scroll, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ['style', 'class']
            })
          }
        }
      },
    },
    beforeDestroy () {
      // 清理 ResizeObserver
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }
      
      // 清理 MutationObserver
      if (this.mutationObserver) {
        this.mutationObserver.disconnect()
        this.mutationObserver = null
      }
      
      // 清理定时器
      if (this.recomputeTimer) {
        clearTimeout(this.recomputeTimer)
        this.recomputeTimer = null
      }
    },
  }
</script>
<style lang="stylus" rel="stylesheet/stylus" scoped>
  .mpx-movable-area-container
      position: relative
      .mpx-movable-scroll-wrapper
          position: absolute
          top: 0
          left: 0
          bottom: 0
          right: 0
</style>
