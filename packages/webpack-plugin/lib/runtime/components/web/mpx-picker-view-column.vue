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
  inject: ['indicatorMaskHeight'],
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
      wheel: null,
      selectedIndex: [0],
      currentIndicatorMaskHeight: 0,
      childrenCount: 0,
      lastSelectedIndex: [0]
    }
  },
  watch: {
    selectedIndex (newVal, oldVal) {
      if (this.wheel) {
        // 获取滚轮当前实际位置
        const currentActualIndex = this.wheel.getSelectedIndex()
        console.log('column selectedIndex changed', newVal, 'wheel actual:', currentActualIndex)
        
        // 只有当新值与滚轮实际位置不同时才执行 wheelTo
        if (newVal[0] !== currentActualIndex) {
          console.log('wheelTo', newVal[0], 'from actual:', currentActualIndex)
          this.lastSelectedIndex = [...newVal]
          this.$nextTick(() => {
            // make sure the dom rendering is complete
            this.wheel.refresh()
            this.wheel.wheelTo(newVal[0])
          })
        } else {
          // 即使值相同，也要更新 lastSelectedIndex，保持状态同步
          this.lastSelectedIndex = [...newVal]
        }
      }
    },
    indicatorMaskHeight: {
      handler(newHeight) {
        if (newHeight && newHeight !== this.currentIndicatorMaskHeight) {
          this.currentIndicatorMaskHeight = newHeight
          this.refresh()
        }
      },
      immediate: true
    }
  },
  mounted () {
    this.wheel = null
    this.childrenCount = this.$refs.wheelScroll ? this.$refs.wheelScroll.children.length : 0
    this.refresh()
  },
  updated () {
    const currentChildrenCount = this.$refs.wheelScroll ? this.$refs.wheelScroll.children.length : 0
    if (currentChildrenCount !== this.childrenCount) {
      this.childrenCount = currentChildrenCount
      this.refresh()
    }
  },
  beforeDestroy () {
    if (this.wheel) {
      this.wheel.destroy()
    }
  },
  methods: {
    refresh () {
      if (this.refreshing) return
     
      this.refreshing = true
      for (let i = 0; i < this.$refs.wheelScroll.children.length; i++) {
        if (this.currentIndicatorMaskHeight) {
          this.$refs.wheelScroll.children[i].style.height = this.currentIndicatorMaskHeight + 'px'
        }
      }
      this.$nextTick(() => {
        const wheelWrapper = this.$refs.wheelWrapper
        if (this.wheel) {
          this.wheel.refresh()
          this.refreshing = false
          return
        }
        this.wheel = new BScroll(wheelWrapper, extend({
          wheel: {
            selectedIndex: this.selectedIndex[0],
            rotate: -5,
            wheelWrapperClass: 'wheel-scroll'
          },
          probeType: 3,
          bindToWrapper: true
        }, this.scrollOptions))
        this.wheel.on('scrollStart', function () {
          console.log('scrollStart=======', this.lastSelectedIndex)
          if (this.pickerView) {
            this.pickerView.notifyPickstart()
          }
        }.bind(this))
        this.wheel.on('scrollEnd', function () {
          console.log('scrollEnd=======', this.lastSelectedIndex)
          if (this.refreshing) return
          // 只更新 lastSelectedIndex，不触发 watcher
          const actualIndex = this.wheel.getSelectedIndex()
          this.lastSelectedIndex = [actualIndex]
          
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
