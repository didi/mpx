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
      childrenCount: 0
    }
  },
  watch: {
    selectedIndex (newVal) {
      if (this.wheel) {
        this.$nextTick(() => {
          // make sure the dom rendering is complete
          this.wheel.refresh()
          this.wheel.wheelTo(newVal[0])
        })
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
          if (this.pickerView) {
            this.pickerView.notifyPickstart()
          }
        }.bind(this))
        this.wheel.on('scrollEnd', function () {
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
