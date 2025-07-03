<template>
  <div 
    class="picker-view"
    :class="maskClass"
    :style="maskStyle"
    ref="pickerView"
  >
    <div class="picker-view-content">
      <!-- 上部分遮罩 -->
      <div 
        class="picker-view-mask-top"
        :style="{ height: maskHeight + 'px' }"
      ></div>
      
      <!-- 下部分遮罩 -->
      <div 
        class="picker-view-mask-bottom"
        :style="{ height: maskHeight + 'px' }"
      ></div>
      
      <!-- 中间指示器 -->
      <div 
        class="picker-view-indicator"
        :class="indicatorClass"
        :style="[indicatorStyleObject, { height: indicatorHeight + 'px' }]"
        ref="indicator"
      ></div>
      
      <!-- 滚动容器 -->
      <div class="picker-view-columns" :style="{ paddingTop: maskHeight + 'px', paddingBottom: maskHeight + 'px' }">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PickerView',
  props: {
    // 数组中的数字依次表示 picker-view 内的 picker-view-column 选择的第几项（下标从 0 开始）
    value: {
      type: Array,
      default: () => []
    },
    // 设置选择器中间选中框的样式
    indicatorStyle: {
      type: String,
      default: ''
    },
    // 设置选择器中间选中框的类名
    indicatorClass: {
      type: String,
      default: ''
    },
    // 设置蒙层的样式
    maskStyle: {
      type: String,
      default: ''
    },
    // 设置蒙层的类名
    maskClass: {
      type: String,
      default: ''
    },
    // 是否在手指松开时立即触发 change 事件
    immediateChange: {
      type: Boolean,
      default: false
    }
  },
  provide() {
    return {
      pickerView: this
    }
  },
  data() {
    return {
      columns: [],
      currentValue: [...this.value],
      maskHeight: 0,
      indicatorHeight: 34,
      isScrolling: false
    }
  },
  computed: {
    indicatorStyleObject() {
      if (!this.indicatorStyle) return {}
      
      // 解析 CSS 样式字符串
      const styles = {}
      this.indicatorStyle.split(';').forEach(style => {
        const [key, value] = style.split(':').map(s => s.trim())
        if (key && value) {
          // 转换 CSS 属性名为驼峰命名
          const camelKey = key.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
          styles[camelKey] = value
        }
      })
      
      return styles
    }
  },
  watch: {
    value: {
      handler(newVal) {
        if (JSON.stringify(newVal) !== JSON.stringify(this.currentValue)) {
          this.currentValue = [...newVal]
          this.updateColumns()
        }
      },
      deep: true
    },
    indicatorStyle() {
      this.$nextTick(() => {
        this.updateLayout()
      })
    }
  },
  mounted() {
    this.updateLayout()
    this.currentValue = [...this.value]
  },
  methods: {
    // 注册列组件
    registerColumn(column) {
      this.columns.push(column)
    },
    
    // 注销列组件
    unregisterColumn(column) {
      const index = this.columns.indexOf(column)
      if (index > -1) {
        this.columns.splice(index, 1)
      }
    },
    
    // 更新布局
    updateLayout() {
      if (!this.$refs.indicator) return
      
      const containerHeight = this.$refs.pickerView.offsetHeight
      this.indicatorHeight = this.$refs.indicator.offsetHeight || 34
      this.maskHeight = (containerHeight - this.indicatorHeight) / 2
    },
    
    // 更新所有列的选中项
    updateColumns() {
      this.columns.forEach((column, index) => {
        if (column && this.currentValue[index] !== undefined) {
          column.setSelectedIndex(this.currentValue[index])
        }
      })
    },
    
    // 获取当前所有列的选中值
    getCurrentValue() {
      return this.columns.map(column => column.getSelectedIndex())
    },
    
    // 列值变化时调用
    onColumnChange(columnIndex, selectedIndex) {
      this.currentValue[columnIndex] = selectedIndex
      
      if (this.immediateChange || !this.isScrolling) {
        this.emitChange()
      }
    },
    
    // 滚动开始
    onPickStart() {
      this.isScrolling = true
      this.$emit('pickstart', {
        type: 'pickstart',
        target: this,
        currentTarget: this
      })
    },
    
    // 滚动结束
    onPickEnd() {
      this.isScrolling = false
      this.$emit('pickend', {
        type: 'pickend',
        target: this,
        currentTarget: this
      })
      
      if (!this.immediateChange) {
        this.emitChange()
      }
    },
    
    // 发送 change 事件
    emitChange() {
      const value = this.getCurrentValue()
      this.$emit('change', {
        type: 'change',
        target: this,
        currentTarget: this,
        detail: {
          value: value
        }
      })
    }
  }
}
</script>

<style scoped>
.picker-view {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #ffffff;
}

.picker-view-content {
  position: relative;
  width: 100%;
  height: 100%;
}

.picker-view-mask-top,
.picker-view-mask-bottom {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 10;
  pointer-events: none;
}

.picker-view-mask-top {
  top: 0;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.6));
}

.picker-view-mask-bottom {
  bottom: 0;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.6));
}

.picker-view-indicator {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  border-top: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
  z-index: 10;
  pointer-events: none;
}

.picker-view-columns {
  display: flex;
  height: 100%;
  align-items: stretch;
}

/* 1px 边框适配 */
@media (-webkit-min-device-pixel-ratio: 2), (min-device-pixel-ratio: 2) {
  .picker-view-indicator {
    border-top: 0.5px solid #e5e5e5;
    border-bottom: 0.5px solid #e5e5e5;
  }
}

@media (-webkit-min-device-pixel-ratio: 3), (min-device-pixel-ratio: 3) {
  .picker-view-indicator {
    border-top: 0.33px solid #e5e5e5;
    border-bottom: 0.33px solid #e5e5e5;
  }
}
</style> 