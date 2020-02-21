<template>
  <div class="mpx-picker-container">
    <div @click="show">
      <slot></slot>
    </div>
    <transition name="mpx-picker-fade">
      <div class="mpx-picker" v-show="isShow" @touchmove.prevent @click="_cancel">
        <transition name="mpx-picker-move">
          <div class="mpx-picker-panel" v-show="isShow" @click.stop>
            <div class="mpx-picker-choose border-bottom-1px">
              <span class="cancel" @click="_cancel">取消</span>
              <span class="confirm" @click="_confirm">确定</span>
            </div>
            <div class="mpx-picker-content">
              <div class="mask-top border-bottom-1px"></div>
              <div class="mask-bottom border-top-1px"></div>
              <div class="wheel-wrapper" ref="wheelWrapper">
                <div class="wheel" v-for="(data, index) in pickerData" :key="index">
                  <ul class="wheel-scroll">
                    <li
                      v-for="item in data" :key="item"
                      class="wheel-item">{{item}}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>


<script type="text/ecmascript-6">
  import BScroll from '@better-scroll/core'
  import Wheel from '@better-scroll/wheel'
  import type from '../../../utils/type'
  import { getCustomEvent } from './getInnerListeners'

  BScroll.use(Wheel)

  function getPickerData (range, rangeKey) {
    if (range) {
      return range.map((item) => {
        if (rangeKey && type(item) === 'Object') {
          return item[rangeKey]
        }
        return item
      })
    }
    return range
  }

  export default {
    name: 'mpx-picker',
    props: {
      mode: {
        type: String,
        default: 'selector'
      },
      disabled: Boolean,
      range: {
        type: Array,
        default () {
          return []
        }
      },
      rangeKey: String,
      value: {
        type: [Number, String, Array],
        default () {
          switch (this.mode) {
            case 'selector':
              return 0
            case 'multiSelector':
              return []
            default:
              return ''
          }
        }
      },
      start: String,
      end: String,
      fields: {
        type: String,
        value: 'day'
      }
    },
    data () {
      return {
        isShow: false
      }
    },
    computed: {
      pickerData () {
        switch (this.mode) {
          case 'selector':
            return [getPickerData(this.range, this.rangeKey)]
          case 'multiSelector':
            return this.range.map((item) => {
              return getPickerData(item, this.rangeKey)
            })
          default:
            return []
        }
      }
    },
    watch: {
      pickerData () {
        this.refresh()
      },
      value: {
        handler () {
          switch (this.mode) {
            case 'selector':
              this.selectedIndex = [this.value]
              break
            case 'multiSelector':
              this.selectedIndex = []
              for (let i = 0; i < this.range.length; i++) {
                this.selectedIndex[i] = this.value[i] || 0
              }
              break
            default:
              this.selectedIndex = [0]
          }
          this.refresh()
        },
        immediate: true
      }
    },
    mounted () {
      this.wheels = []
      this.refresh()
    },
    beforeDestroy () {
      this.wheels.forEach((wheel) => {
        wheel.destroy()
      })
      this.wheels = []
    },
    methods: {
      _confirm () {
        if (this._isMoving()) {
          return
        }
        this.hide()
        this.$emit('change', getCustomEvent('change', {
          value: this.mode === 'multiSelector' ? this.selectedIndex.slice() : this.selectedIndex[0]
        }))
      },
      _cancel () {
        this.hide()
        this.$emit('cancel', getCustomEvent('cancel'))
      },
      _isMoving () {
        return this.wheels.some((wheel) => {
          return wheel.pending
        })
      },
      show () {
        this.isShow = true
        if (this.needRefresh) {
          this.needRefresh = false
          this.refresh()
        }
      },
      hide () {
        this.isShow = false
      },
      refresh () {
        if (this.isShow) {
          if (this.refreshing) return
          this.refreshing = true
          this.$nextTick(() => {
            let i = 0
            const wheelWrapper = this.$refs.wheelWrapper
            for (; i < this.pickerData.length; i++) {
              this.selectedIndex[i] = this.selectedIndex[i] || 0
              if (this.selectedIndex[i] >= this.pickerData[i].length) {
                this.selectedIndex[i] = 0
              }
              if (this.wheels[i]) {
                this.wheels[i].refresh()
                if (this.wheels[i].getSelectedIndex() !== this.selectedIndex[i]) {
                  this.wheels[i].wheelTo(this.selectedIndex[i])
                }
              } else {
                this.wheels[i] = new BScroll(wheelWrapper.children[i], {
                  wheel: {
                    selectedIndex: this.selectedIndex[i],
                    wheelWrapperClass: 'wheel-scroll',
                    wheelItemClass: 'wheel-item'
                  },
                  probeType: 3
                })

                this.wheels[i].on('scrollEnd', function (i) {
                  if (this.refreshing) return
                  const currentIndex = this.wheels[i].getSelectedIndex()
                  if (this.selectedIndex[i] !== currentIndex) {
                    this.selectedIndex[i] = currentIndex
                    if (this.mode === 'multiSelector') {
                      this.$emit('columnchange', getCustomEvent('columnchange', {
                        column: i,
                        value: currentIndex
                      }))
                    }
                  }
                }.bind(this, i))
              }
            }
            for (; i < this.wheels.length; i++) {
              if (this.wheels[i]) {
                this.wheels[i].destroy()
              }
            }
            this.wheels.length = this.pickerData.length
            this.selectedIndex.length = this.pickerData.length
            this.refreshing = false
          })
        } else {
          this.needRefresh = true
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

  .mpx-picker
    position: fixed
    left: 0
    top: 0
    z-index: 100
    width: 100%
    height: 100%
    overflow: hidden
    text-align: center
    font-size: 14px
    background-color: rgba(37, 38, 45, .4)

    &.mpx-picker-fade-enter, &.mpx-picker-fade-leave-active
      opacity: 0

    &.mpx-picker-fade-enter-active, &.mpx-picker-fade-leave-active
      transition: all .3s ease-in-out

    .mpx-picker-panel
      position: absolute
      z-index: 600
      bottom: 0
      width: 100%
      height: 273px
      background: white

      &.mpx-picker-move-enter, &.mpx-picker-move-leave-active
        transform: translate3d(0, 273px, 0)

      &.mpx-picker-move-enter-active, &.mpx-picker-move-leave-active
        transition: all .3s ease-in-out

      .mpx-picker-choose
        position: relative
        height: 60px
        color: #999

        .mpx-picker-title
          margin: 0
          line-height: 60px
          font-weight: normal
          text-align: center
          font-size: 18px
          color: #333

        .confirm, .cancel
          position: absolute
          top: 6px
          padding: 16px
          font-size: 14px

        .confirm
          right: 0
          color: #007bff

          &:active
            color: #5aaaff

        .cancel
          left: 0

          &:active
            color: #c2c2c2

      .mpx-picker-content
        position: relative
        top: 20px

        .mask-top, .mask-bottom
          z-index: 10
          width: 100%
          height: 68px
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

      .wheel-wrapper
        display: flex
        padding: 0 16px

        .wheel
          -ms-flex: 1 1 0.000000001px
          -webkit-box-flex: 1
          -webkit-flex: 1
          flex: 1
          -webkit-flex-basis: 0.000000001px
          flex-basis: 0.000000001px
          width: 1%
          height: 173px
          overflow: hidden
          font-size: 18px

          .wheel-scroll
            padding: 0
            margin-top: 68px
            line-height: 36px
            list-style: none

            .wheel-item
              list-style: none
              height: 36px
              overflow: hidden
              white-space: nowrap
              color: #333

</style>
