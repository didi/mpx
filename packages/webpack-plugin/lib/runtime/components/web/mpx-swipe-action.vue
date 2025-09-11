<template>
  <div class="mpx-swipe-action">
    <div 
      ref="swipeContent"
      class="swipe-content"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- 主内容区域 -->
      <div 
        class="content-area" 
        @click="handleContentTap"
      >
        <slot></slot>
      </div>
    
      <!-- 右侧操作按钮区域 -->
      <div 
        class="action-area" 
        :style="`width: ${totalActionWidth}px; right: -${totalActionWidth}px;`"
      >
        <div 
          v-for="(item, index) in finalActions" 
          :key="index"
          class="action-button"
          :style="`width: ${item.width || actionWidth}px; background-color: ${item.background || item.color || '#ff4757'}; color: ${item.textColor || '#fff'}; font-size: ${item.fontSize || 16}px; font-weight: ${item.fontWeight || '500'}; ${item.style || ''}`"
          @click="handleActionTap(index, item)"
        >{{ item.text }}</div>
      </div>
    </div>
  </div>
</template>

<script>
// 全局状态管理，用于自动关闭其他已打开的组件
const openedInstances = new Set()

export default {
  name: 'MpxSwipeAction',
  props: {
    // 单按钮配置（向后兼容）
    actionWidth: {
      type: Number,
      default: 80
    },
    actionColor: {
      type: String,
      default: '#ff4757'
    },
    actionText: {
      type: String,
      default: '删除'
    },
    actionTextColor: {
      type: String,
      default: '#fff'
    },
    actionBackground: {
      type: String,
      default: ''
    },
    actionFontSize: {
      type: Number,
      default: 16
    },
    actionFontWeight: {
      type: String,
      default: '500'
    },
    actionStyle: {
      type: String,
      default: ''
    },
    // 多按钮配置
    actions: {
      type: Array,
      default: () => []
    },
    rightThreshold: {
      type: Number,
      default: 0
    },
    disabled: {
      type: Boolean,
      default: false
    },
    autoClose: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      contentX: 0,
      isOpened: false,
      animation: true,
      isDragging: false,
      startX: 0
    }
  },

  computed: {
    // 处理多按钮配置，优先使用 actions，否则使用单按钮配置
    finalActions() {
      if (this.actions && this.actions.length > 0) {
        return this.actions
      }
      return [{
        text: this.actionText,
        color: this.actionColor,
        textColor: this.actionTextColor,
        background: this.actionBackground,
        width: this.actionWidth,
        fontSize: this.actionFontSize,
        fontWeight: this.actionFontWeight,
        style: this.actionStyle
      }]
    },

    totalActionWidth() {
      return this.finalActions.reduce((sum, action) => {
        return sum + (action.width || this.actionWidth)
      }, 0)
    },

    // 关闭阈值（向右滑动小于此值时隐藏按钮）  
    closeThreshold() {
      // 关闭阈值稍小一些，避免频繁切换
      return this.rightThreshold * 0.6
    }
  },

  mounted() {
    // 确保初始状态为正确的二态位置
    this.ensureBinaryPosition()
    // 初始化样式
    this.updateTransform()
  },

  beforeUnmount() {
    // 组件销毁时清理
    this.unregisterInstance()
  },

  methods: {
    // 更新 transform 样式
    updateTransform() {
      if (this.$refs.swipeContent) {
        this.$refs.swipeContent.style.transform = `translateX(${this.contentX}px)`
        this.$refs.swipeContent.style.transition = this.animation ? 'transform 0.3s ease' : 'none'
      }
    },

    // 确保二态位置
    ensureBinaryPosition() {
      const targetX = this.isOpened ? -this.totalActionWidth : 0
      if (this.contentX !== targetX) {
        this.contentX = targetX
        this.updateTransform()
      }
    },

    // 处理触摸移动
    handleTouchMove(e) {
      if (!this.isDragging) return
      
      const currentX = e.touches[0].clientX
      const deltaX = this.startX - currentX  // 向左滑动为正值
      
      // 跟手滑动效果
      if (this.isOpened) {
        // 当前是打开状态，允许向右滑动关闭
        if (deltaX <= 0) {
          // 向右滑动，从完全打开位置开始
          const slideBack = Math.abs(deltaX)
          const maxSlideBack = this.totalActionWidth
          const actualSlide = Math.min(slideBack, maxSlideBack)
          this.contentX = -this.totalActionWidth + actualSlide
          this.updateTransform()
        } else {
          // 向左滑动，保持在完全打开位置
          this.contentX = -this.totalActionWidth
          this.updateTransform()
        }
      } else {
        // 当前是关闭状态，允许向左滑动打开
        if (deltaX >= 0) {
          // 向左滑动，限制最大滑动距离
          const maxSlide = this.totalActionWidth
          const actualSlide = Math.min(deltaX, maxSlide)
          this.contentX = -actualSlide
          this.updateTransform()
        } else {
          // 向右滑动，保持在关闭位置
          this.contentX = 0
          this.updateTransform()
        }
      }
    },

    // 处理触摸开始
    handleTouchStart(e) {
      this.startX = e.touches[0].clientX
      this.isDragging = true
      // 关闭动画，实现即时响应
      this.animation = false
    },

    // 处理触摸结束
    handleTouchEnd(e) {
      this.isDragging = false
      // 重新开启动画
      this.animation = true
      
      // 根据当前状态和滑动距离决定最终状态
      const currentSlideDistance = Math.abs(this.contentX)
      const threshold = this.rightThreshold || this.totalActionWidth * 0.3
      
      if (this.isOpened) {
        // 当前是打开状态，判断是否要关闭
        const closedDistance = this.totalActionWidth - currentSlideDistance // 已经关闭的距离
        const closeThreshold = this.totalActionWidth * 0.2 // 关闭阈值设置为20%

        if (closedDistance >= closeThreshold) {
          // 向右滑动超过20%，关闭
          this.snapToClose()
        } else {
          // 未超过关闭阈值，保持打开
          this.snapToOpen()
        }
      } else {
        // 当前是关闭状态，判断是否要打开
        if (currentSlideDistance >= threshold) {
          // 向左滑动超过阈值，打开
          this.snapToOpen()
        } else {
          // 未超过阈值，保持关闭
          this.snapToClose()
        }
      }
    },

    // 吸附到打开状态
    snapToOpen() {
      this.contentX = -this.totalActionWidth
      this.updateTransform()
      if (!this.isOpened) {
        this.isOpened = true
        this.$emit('open', {
          actionWidth: this.totalActionWidth,
          actions: this.finalActions,
          actionCount: this.finalActions.length
        })
        
        if (this.autoClose) {
          this.closeOtherInstances()
          this.registerInstance()
        }
      }
    },

    // 吸附到关闭状态
    snapToClose() {
      this.contentX = 0
      this.updateTransform()
      if (this.isOpened) {
        this.isOpened = false
        this.$emit('close', {})
        
        if (this.autoClose) {
          this.unregisterInstance()
        }
      }
    },

    // 切换到打开状态
    switchToOpenState(useAnimation = false) {
      if (useAnimation) {
        this.animation = true
      }
      this.contentX = -this.totalActionWidth
      this.updateTransform()
      this.isOpened = true
      
      this.$emit('open', {
        actionWidth: this.totalActionWidth,
        actions: this.finalActions,
        actionCount: this.finalActions.length
      })
      
      // 自动关闭其他实例
      if (this.autoClose) {
        this.closeOtherInstances()
        this.registerInstance()
      }
    },

    // 切换到关闭状态
    switchToCloseState(useAnimation = false) {
      if (useAnimation) {
        this.animation = true
      }
      this.contentX = 0
      this.updateTransform()
      this.isOpened = false
      
      this.$emit('close', {})
      
      if (this.autoClose) {
        this.unregisterInstance()
      }
    },

    // 打开操作区域（编程式调用）
    openActions() {
      this.animation = true
      this.snapToOpen()
    },

    // 关闭操作区域（编程式调用）
    closeActions() {
      this.animation = true
      this.snapToClose()
    },

    // 处理内容区域点击
    handleContentTap(e) {
      // 如果已打开，则关闭
      if (this.isOpened) {
        this.closeActions()
      } else {
        // 透传点击事件
        this.$emit('tap', e)
      }
    },

    // 处理操作按钮点击
    handleActionTap(index, action) {
      this.$emit('actiontap', {
        actionIndex: index,
        actionText: action.text,
        actionWidth: action.width || this.actionWidth,
        action: action
      })
      
      // 点击操作按钮后自动关闭
      this.closeActions()
    },

    // 注册实例
    registerInstance() {
      if (this.autoClose) {
        openedInstances.add(this)
      }
    },

    // 注销实例
    unregisterInstance() {
      openedInstances.delete(this)
    },

    // 关闭其他已打开的实例
    closeOtherInstances() {
      if (this.autoClose) {
        openedInstances.forEach(instance => {
          if (instance !== this) {
            instance.closeActions()
          }
        })
      }
    },

    // 暴露给外部的方法
    open() {
      this.openActions()
    },

    close() {
      this.closeActions()
    }
  }
}
</script>

<style scoped>
.mpx-swipe-action {
  position: relative;
  width: 100%;
}

.content-area {
  width: 100%; 
  height: 100%;
}

.swipe-container {
  width: 100%;
}

.swipe-content {
  width: 100%;
  height: 100%;
}

.action-area {
  display: flex;
  height: 100%; 
  position: absolute; 
  top: 0
}

.action-button {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
