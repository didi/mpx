<template>
  <div :class="['mpx-picker-view', maskClass]" :style="maskStyle" ref="mpxView">
    <transition name="mpx-picker-fade">
      <transition name="mpx-picker-move">
        <div class="mpx-picker-panel" @click.stop>
          <div class="mpx-picker-content">
            <div class="mask-top" :style="'height:' + maskHeight + 'px'"></div>
            <div class="mask-bottom" :style="'height:' + maskHeight + 'px'"></div>
            <div :class="['indicator-mask', 'border-bottom-1px', 'border-top-1px', indicatorClass]"
              :style="indicatorStyle" ref="indicatorMask"></div>
            <div class="wheel-container" :style="'padding-top:' + maskHeight + 'px'">
              <slot></slot>
            </div>
          </div>
        </div>
      </transition>
    </transition>
  </div>
</template>

<script type="text/ecmascript-6">
  import { computed } from 'vue'
  import { getCustomEvent } from './getInnerListeners'

  function travelSlot(slot, effect) {
    let index = 0
    if (slot) {
      slot.forEach((VNode) => {
        if (VNode.tag && VNode.tag.endsWith('mpx-picker-view-column')) {
          effect && effect(VNode, index)
          index += 1
        }
      })
    }
  }

  export default {
    name: 'mpx-picker-view',
    props: {
      value: Array,
      indicatorStyle: String,
      indicatorClass: String,
      maskStyle: String,
      maskClass: String
    },
    provide() {
      return {
        indicatorMaskHeight: computed(() => this.indicatorMaskHeight || 0)
      }
    },
    data() {
      return {
        maskHeight: 0,
        indicatorMaskHeight: 0,
        isExternalUpdate: false,
        pendingWheelToCount: 0
      }
    },
    watch: {
      value: {
        handler(newVal) {
          // console.log('column set value', newVal)
          this.setValue(newVal)
        },
        deep: true
      },
      indicatorStyle: {
        handler() {
          this.$nextTick(() => {
            this.updateIndicatorMaskHeight()
          })
        }
      },
      indicatorClass: {
        handler() {
          this.$nextTick(() => {
            this.updateIndicatorMaskHeight()
          })
        }
      }
    },
    mounted() {
      this.updateIndicatorMaskHeight()
      if (this.value) {
        this.setValue(this.value)
      } else {
        this.getValue()
      }
    },
    methods: {
      setValue(value) {
        // console.log('setValue called with:', value)
        // 标记这是外部更新，计算需要wheelTo的列数
        this.isExternalUpdate = true
        this.pendingWheelToCount = 0

        // 先统计需要wheelTo的列数
        this.$children.forEach((child, i) => {
          if (child.$options.name === 'mpx-picker-view-column' && value[i] !== undefined) {
            const currentActualIndex = child.wheel && child.wheel.getSelectedIndex() || 0
            if (value[i] !== currentActualIndex) {
              this.pendingWheelToCount = this.pendingWheelToCount + 1
            }
          }
        })

        // console.log('setValue pendingWheelToCount:', this.pendingWheelToCount)

        // 直接遍历 $children，更新值
        this.$children.forEach((child, i) => {
          if (child.$options.name === 'mpx-picker-view-column') {
            if (!child.pickerView) {
              child.pickerView = this
            }
            if (value[i] !== undefined) {
              // console.log('updating column', i, 'from', child.selectedIndex, 'to', value[i])
              this.$set(child, 'selectedIndex', value[i])
            }
          }
        })

        // 如果没有需要wheelTo的列，立即重置状态
        if (this.pendingWheelToCount === 0) {
          this.isExternalUpdate = false
        }
      },
      getValue() {
        let value = []
        this.$children.forEach((child, i) => {
          if (child.$options.name === 'mpx-picker-view-column') {
            if (!child.pickerView) {
              child.pickerView = this
            }
            value.push(child.wheel && child.wheel.getSelectedIndex() || 0)
          }
        })
        return value
      },
      notifyChange() {
        // 如果是外部更新引起的滚动，不触发 change 事件
        if (this.isExternalUpdate) {
          // console.log('skip notifyChange during external update')
          return
        }
        const value = this.getValue()
        // console.log('notifyChange column', value)
        this.$emit('change', getCustomEvent('change', { value }, this))
      },
      notifyPickstart() {
        this.$emit('pickstart', getCustomEvent('pickstart', {}, this))
      },
      notifyPickend() {
        this.$emit('pickend', getCustomEvent('pickend', {}, this))
      },
      updateIndicatorMaskHeight() {
        let containerHeight = this.$refs.mpxView.offsetHeight
        this.indicatorMaskHeight = this.$refs.indicatorMask.offsetHeight
        this.maskHeight = (containerHeight - this.indicatorMaskHeight) / 2
      },
      onWheelToComplete() {
        this.pendingWheelToCount = this.pendingWheelToCount - 1
        // console.log('wheelTo complete, remaining:', this.pendingWheelToCount)

        // 所有 wheelTo 都完成了，触发 change 事件并重置状态
        if (this.pendingWheelToCount <= 0) {
          this.isExternalUpdate = false
          // console.log('all wheelTo completed, external update finished')

          // 外部更新完成后，触发一次 change 事件
          const value = this.getValue()
          this.$emit('change', getCustomEvent('change', { value }, this))
          // console.log('external update change event:', value)
        }
      }
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  .border-top-1px
    position: relative

    &:before
      content: ""
      pointer-events: none
      display: block
      position: absolute
      left: 0
      top: 0
      transform-origin: 0 0
      border-top: 1px solid #ebebeb
      box-sizing border-box
      width 100%
      height 100%
      @media (-webkit-min-device-pixel-ratio: 2), (min-device-pixel-ratio: 2)
        width: 200%
        height: 200%
        transform: scale(.5) translateZ(0)
      @media (-webkit-min-device-pixel-ratio: 3), (min-device-pixel-ratio: 3)
        width: 300%
        height: 300%
        transform: scale(1 / 3) translateZ(0)

  .border-bottom-1px
    position: relative

    &:before
      content: ""
      pointer-events: none
      display: block
      position: absolute
      left: 0
      top: 0
      transform-origin: 0 0
      border-bottom: 1px solid #ebebeb
      box-sizing border-box
      width 100%
      height 100%
      @media (-webkit-min-device-pixel-ratio: 2), (min-device-pixel-ratio: 2)
        width: 200%
        height: 200%
        transform: scale(.5) translateZ(0)
      @media (-webkit-min-device-pixel-ratio: 3), (min-device-pixel-ratio: 3)
        width: 300%
        height: 300%
        transform: scale(1 / 3) translateZ(0)

  .mpx-picker-view
    width: 100%
    height: 100%
    overflow: hidden
    text-align: center
    font-size: 16px
    position: relative

    &.mpx-picker-fade-enter, &.mpx-picker-fade-leave-active
      opacity: 0

    &.mpx-picker-fade-enter-active, &.mpx-picker-fade-leave-active
      transition: all .3s ease-in-out

    .mpx-picker-panel
      width: 100%

      &.mpx-picker-move-enter, &.mpx-picker-move-leave-active
        transform: translate3d(0, 273px, 0)

      &.mpx-picker-move-enter-active, &.mpx-picker-move-leave-active
        transition: all .3s ease-in-out

      .mpx-picker-content
        overflow: hidden

        .mask-top, .mask-bottom
          z-index: 10
          width: 100%
          pointer-events: none
          transform: translateZ(0)

        .mask-top
          position: absolute
          top: 0
          background: linear-gradient(to top, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.8))

        .mask-bottom
          position: absolute
          bottom: 0
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.8))

        .indicator-mask
          position: absolute
          top: 50%
          left: 0
          right: 0
          transform: translateY(-50%)

      .wheel-container
        display: flex
        padding: 0 16px
</style>
