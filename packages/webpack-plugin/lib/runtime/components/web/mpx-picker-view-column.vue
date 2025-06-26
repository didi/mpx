<template>
  <div class="mpx-picker-colunm-view wheel-wrapper" ref="wheelWrapper">
    <div class="wheel-scroll" ref="wheelScroll">
      <slot></slot>
    </div>
  </div>
</template>

<script type="text/ecmascript-6">
import BScroll from '@better-scroll/core'
import Wheel from '@better-scroll/wheel'
import { extend } from '../../utils'

BScroll.use(Wheel)

export default {
  name: 'mpx-picker-view-column',
  props: {
    value: Array,
    scrollOptions: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data () {
    return {
      wheels: [],
      selectedIndex: [0],
      cachedIndicatorMaskHeight: 0, // 缓存指示器高度
      refreshTimer: null // 防抖定时器
    }
  },
  computed: {},
  watch: {
    selectedIndex (newVal) {
      if (this.wheels[0]) {
        this.$nextTick(() => {
          // make sure the dom rendering is complete
          this.wheels[0].refresh()
          this.wheels[0].wheelTo(newVal[0])
        })
      }
    },
    // 监听父组件的indicatorStyle变化
    '$parent.indicatorStyle': {
      handler() {
        // 使用防抖版本，避免频繁调用
        this.debouncedRefresh()
      },
      immediate: false
    }
  },
  mounted () {
    this.wheels = []
    this.refresh()
  },
  // 移除updated钩子，改为使用activated处理页面切换
  activated () {
    // 页面被激活时，检查是否需要重新计算尺寸
    if (this.cachedIndicatorMaskHeight === 0) {
      this.$nextTick(() => {
        this.refresh()
      })
    }
  },
  beforeDestroy () {
    // 清理定时器
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }
    this.wheels.forEach((wheel) => {
      wheel.destroy()
    })
    this.wheels = []
  },
  methods: {
    // 防抖版本的refresh
    debouncedRefresh() {
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer)
      }
      this.refreshTimer = setTimeout(() => {
        this.refresh()
      }, 16) // 大约一帧的时间
    },
    
    refresh () {
      if (this.refreshing) return
     
      this.refreshing = true
      const indicatorMask = this.$parent.$refs.indicatorMask
      let indicatorMaskHeight = indicatorMask.offsetHeight
      
      if (!indicatorMaskHeight) {
        const computedStyle = getComputedStyle(indicatorMask)
        indicatorMaskHeight = parseInt(computedStyle.height) || 0
      }
      
      // 缓存有效的高度值
      if (indicatorMaskHeight > 0) {
        this.cachedIndicatorMaskHeight = indicatorMaskHeight
      } else if (this.cachedIndicatorMaskHeight > 0) {
        // 如果获取不到当前高度，使用缓存值
        indicatorMaskHeight = this.cachedIndicatorMaskHeight
      }

      for (let i = 0; i < this.$refs.wheelScroll.children.length; i++) {
        this.$refs.wheelScroll.children[i].style.height = `${indicatorMaskHeight}px`
      }
      this.$nextTick(() => {
        const wheelWrapper = this.$refs.wheelWrapper
        if (this.wheels[0]) {
          this.wheels[0].refresh()
          this.refreshing = false
          return
        }
        this.wheels[0] = new BScroll(wheelWrapper, extend({
          wheel: {
            selectedIndex: this.selectedIndex[0],
            rotate: -5,
            wheelWrapperClass: 'wheel-scroll'
          },
          probeType: 3,
          bindToWrapper: true
        }, this.scrollOptions))
        this.wheels[0].on('scrollStart', function () {
          if (this.pickerView) {
            this.pickerView.notifyPickstart()
          }
        }.bind(this))
        this.wheels[0].on('scrollEnd', function () {
          if (this.refreshing) return
          if (this.pickerView) {
            this.pickerView.notifyChange()
            this.pickerView.notifyPickend()
          }
        }.bind(this))
        this.refreshing = false
      })
    }
  }
}
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  .mpx-picker-colunm-view
    flex 1
</style>
