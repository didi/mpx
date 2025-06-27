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
  import {getCustomEvent} from './getInnerListeners'

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
        lastChangeValue: null,
        changeTimer: null
      }
    },
    watch: {
      value: {
        handler(newVal) {
          this.setValue(newVal)
        }
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
        this.selectedIndex = value
        // 比较新value和上次change事件的值
        const shouldUpdate = !this.lastChangeValue || 
          !this.arraysEqual(value, this.lastChangeValue)
        console.log('shouldUpdate', shouldUpdate, value, this.lastChangeValue)
        if (shouldUpdate) {
          // 直接遍历 $children，而不依赖 VNode.componentInstance
          this.$children.forEach((child, i) => {
            if (child.$options.name === 'mpx-picker-view-column') {
              if (!child.pickerView) {
                child.pickerView = this
              }
              if (value[i] !== undefined) {
                console.log('updating column', i, 'from', child.selectedIndex[0], 'to', value[i])
                child.selectedIndex.splice(0, 1, value[i])
              }
            }
          })
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
        // 清除之前的定时器
        if (this.changeTimer) {
          clearTimeout(this.changeTimer)
        }
        
        // 延迟触发 change 事件，避免频繁触发
        this.changeTimer = setTimeout(() => {
          const value = this.getValue()
          // 记录本次change事件的值，使用JSON深拷贝避免响应式对象影响比较
          this.lastChangeValue = JSON.parse(JSON.stringify(value))
          this.$emit('change', getCustomEvent('change', { value }, this))
          this.changeTimer = null
        }, 150) // 150ms 延迟，可以根据需要调整
      },
      notifyPickstart() {
        // 用户开始滚动时，取消待触发的 change 事件
        if (this.changeTimer) {
          clearTimeout(this.changeTimer)
          this.changeTimer = null
        }
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
      arraysEqual(a, b) {
        if (!a || !b) return false
        if (a.length !== b.length) return false
        return a.every((val, index) => val === b[index])
      }
    },
    beforeDestroy() {
      // 清理定时器
      if (this.changeTimer) {
        clearTimeout(this.changeTimer)
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
