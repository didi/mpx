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
      scrollOptions: {
        type: Object,
        default: () => {
          return {}
        }
      }
    },
    data() {
      return {
        wheel: null,
        selectedIndex: 0,
        currentIndicatorMaskHeight: 0,
        childrenCount: 0
      }
    },
    watch: {
      selectedIndex(newVal, oldVal) {
        console.log('selectedIndex changed from', oldVal, 'to', newVal)
        if (this.wheel) {
          const currentIndex = this.wheel.getSelectedIndex()
          console.log('wheel currentIndex:', currentIndex)
          
          // 只有当目标值与实际位置不同时才执行wheelTo
          if (newVal !== currentIndex) {
            this.$nextTick(() => {
              console.log('wheelTo from', currentIndex, 'to', newVal)
              this.wheel.refresh()
              this.wheel.wheelTo(newVal)
            })
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
    mounted() {
      this.childrenCount = this.$refs.wheelScroll ? this.$refs.wheelScroll.children.length : 0
      this.setColumnHeight()
      this.refresh()
    },
    updated() {
      const currentChildrenCount = this.$refs.wheelScroll ? this.$refs.wheelScroll.children.length : 0
      if (currentChildrenCount !== this.childrenCount) {
        this.childrenCount = currentChildrenCount
        this.refresh()
      }
    },
    beforeDestroy() {
      if (this.wheel) {
        this.wheel.destroy()
        this.wheel = null
      }
    },
    methods: {
      setColumnHeight() {
        for (let i = 0; i < this.$refs.wheelScroll.children.length; i++) {
          if (this.currentIndicatorMaskHeight) {
            this.$refs.wheelScroll.children[i].style.height = this.currentIndicatorMaskHeight + 'px'
          }
        }
      },
      refresh() {
        if (this.refreshing) return
        this.refreshing = true
        this.$nextTick(() => {
          if (this.wheel) {
            this.wheel.refresh()
            this.refreshing = false
            return
          }

          this.wheel = new BScroll(this.$refs.wheelWrapper, extend({
            wheel: {
              selectedIndex: this.selectedIndex,
              rotate: -5,
              wheelWrapperClass: 'wheel-scroll'
            },
            probeType: 3,
            bindToWrapper: true
          }, this.scrollOptions))

          this.wheel.on('scrollStart', () => {
            if (this.pickerView) {
              this.pickerView.notifyPickstart()
            }
          })

          this.wheel.on('scrollEnd', () => {
            console.log('scrollEnd', this.refreshing)
            if (this.refreshing) return
            
            // 同步 selectedIndex 与 wheel 状态
            const currentIndex = this.wheel.getSelectedIndex()
            if (this.selectedIndex !== currentIndex) {
              this.selectedIndex = currentIndex
            }
            
            if (this.pickerView) {
              this.pickerView.notifyChange()
              this.pickerView.notifyPickend()
            }
          })

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
