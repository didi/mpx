<template>
  <div class="picker-view-column" ref="wrapper">
    <div class="picker-view-column-scroll" ref="scroll">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PickerViewColumn',
  inject: ['pickerView'],
  data() {
    return {
      selectedIndex: 0,
      items: [],
      isScrolling: false,
      scrollContainer: null,
      itemHeight: 34,
      visibleCount: 5,
      startY: 0,
      currentY: 0,
      isDragging: false,
      velocity: 0,
      lastMoveTime: 0,
      lastMoveY: 0,
      animationId: null
    }
  },
  mounted() {
    this.init()
    this.pickerView.registerColumn(this)
  },
  beforeDestroy() {
    this.pickerView.unregisterColumn(this)
    this.cleanup()
  },
  methods: {
    init() {
      this.updateItems()
      this.setupScrollEvents()
      this.updateItemHeight()
    },
    
    cleanup() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
      }
    },
    
    updateItems() {
      this.items = Array.from(this.$refs.scroll.children)
      this.items.forEach((item, index) => {
        item.style.height = this.itemHeight + 'px'
        item.style.display = 'flex'
        item.style.alignItems = 'center'
        item.style.justifyContent = 'center'
        item.style.fontSize = '16px'
        item.style.lineHeight = '1'
        item.style.userSelect = 'none'
        item.style.pointerEvents = 'none'
      })
    },
    
    updateItemHeight() {
      // 根据父组件的指示器高度调整
      this.itemHeight = this.pickerView.indicatorHeight || 34
      this.updateItems()
      this.updateScrollTop()
    },
    
    setupScrollEvents() {
      const wrapper = this.$refs.wrapper
      
      // 触摸事件
      wrapper.addEventListener('touchstart', this.onTouchStart, { passive: false })
      wrapper.addEventListener('touchmove', this.onTouchMove, { passive: false })
      wrapper.addEventListener('touchend', this.onTouchEnd, { passive: false })
      
      // 鼠标事件（桌面端）
      wrapper.addEventListener('mousedown', this.onMouseDown)
      wrapper.addEventListener('mousemove', this.onMouseMove)
      wrapper.addEventListener('mouseup', this.onMouseUp)
      wrapper.addEventListener('wheel', this.onWheel, { passive: false })
    },
    
    onTouchStart(e) {
      e.preventDefault()
      this.startDrag(e.touches[0].clientY)
    },
    
    onTouchMove(e) {
      e.preventDefault()
      if (this.isDragging) {
        this.onDrag(e.touches[0].clientY)
      }
    },
    
    onTouchEnd(e) {
      e.preventDefault()
      this.endDrag()
    },
    
    onMouseDown(e) {
      e.preventDefault()
      this.startDrag(e.clientY)
    },
    
    onMouseMove(e) {
      if (this.isDragging) {
        this.onDrag(e.clientY)
      }
    },
    
    onMouseUp(e) {
      this.endDrag()
    },
    
    onWheel(e) {
      e.preventDefault()
      const delta = e.deltaY
      const direction = delta > 0 ? 1 : -1
      this.setSelectedIndex(this.selectedIndex + direction)
    },
    
    startDrag(y) {
      this.isDragging = true
      this.startY = y
      this.currentY = y
      this.lastMoveY = y
      this.lastMoveTime = Date.now()
      this.velocity = 0
      
      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
      }
      
      this.isScrolling = true
      this.pickerView.onPickStart()
    },
    
    onDrag(y) {
      if (!this.isDragging) return
      
      const now = Date.now()
      const deltaY = y - this.currentY
      const deltaTime = now - this.lastMoveTime
      
      if (deltaTime > 0) {
        this.velocity = deltaY / deltaTime
      }
      
      this.currentY = y
      this.lastMoveY = y
      this.lastMoveTime = now
      
      // 计算移动距离对应的索引变化
      const totalDelta = y - this.startY
      const indexDelta = Math.round(totalDelta / this.itemHeight)
      const newIndex = Math.max(0, Math.min(this.items.length - 1, this.selectedIndex - indexDelta))
      
      this.updateScrollTop(newIndex)
    },
    
    endDrag() {
      if (!this.isDragging) return
      
      this.isDragging = false
      
      // 计算最终位置
      const totalDelta = this.currentY - this.startY
      const indexDelta = Math.round(totalDelta / this.itemHeight)
      let newIndex = this.selectedIndex - indexDelta
      
      // 如果有足够的速度，继续滚动
      if (Math.abs(this.velocity) > 0.5) {
        const momentum = this.velocity * 200 // 调整惯性系数
        const momentumDelta = Math.round(momentum / this.itemHeight)
        newIndex -= momentumDelta
      }
      
      // 限制边界
      newIndex = Math.max(0, Math.min(this.items.length - 1, newIndex))
      
      this.setSelectedIndex(newIndex)
      
      this.isScrolling = false
      this.pickerView.onPickEnd()
    },
    
    setSelectedIndex(index) {
      if (index < 0 || index >= this.items.length) return
      
      this.selectedIndex = index
      this.updateScrollTop()
      this.notifyChange()
    },
    
    getSelectedIndex() {
      return this.selectedIndex
    },
    
    updateScrollTop(index = this.selectedIndex) {
      const scroll = this.$refs.scroll
      const wrapper = this.$refs.wrapper
      
      if (!scroll || !wrapper) return
      
      const wrapperHeight = wrapper.offsetHeight
      const scrollHeight = this.items.length * this.itemHeight
      const targetScrollTop = index * this.itemHeight - (wrapperHeight - this.itemHeight) / 2
      
      // 设置滚动位置
      scroll.style.transform = `translateY(${-targetScrollTop}px)`
      
      // 更新项目的视觉效果
      this.updateItemsVisual(index)
    },
    
    updateItemsVisual(centerIndex) {
      const wrapper = this.$refs.wrapper
      const wrapperHeight = wrapper.offsetHeight
      const centerY = wrapperHeight / 2
      
      this.items.forEach((item, index) => {
        const itemY = (index - centerIndex) * this.itemHeight + centerY
        const distance = Math.abs(itemY - centerY)
        const maxDistance = this.itemHeight * 2
        
        // 计算透明度和缩放
        let opacity = 1
        let scale = 1
        
        if (distance > this.itemHeight / 2) {
          opacity = Math.max(0.3, 1 - distance / maxDistance)
          scale = Math.max(0.8, 1 - distance / maxDistance * 0.2)
        }
        
        item.style.opacity = opacity
        item.style.transform = `scale(${scale})`
        item.style.transition = this.isDragging ? 'none' : 'all 0.2s ease'
      })
    },
    
    notifyChange() {
      const columnIndex = this.pickerView.columns.indexOf(this)
      this.pickerView.onColumnChange(columnIndex, this.selectedIndex)
    }
  },
  
  watch: {
    '$slots.default': {
      handler() {
        this.$nextTick(() => {
          this.updateItems()
          this.updateScrollTop()
        })
      },
      deep: true
    }
  },
  
  updated() {
    this.$nextTick(() => {
      this.updateItems()
      this.updateScrollTop()
    })
  }
}
</script>

<style scoped>
.picker-view-column {
  flex: 1;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.picker-view-column-scroll {
  position: relative;
  transition: transform 0.3s ease;
}

.picker-view-column-scroll > * {
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  cursor: pointer;
  box-sizing: border-box;
}
</style> 