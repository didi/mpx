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
  import { type } from '../../utils'
  import { getCustomEvent } from './getInnerListeners'

  const startYear = 1900
  const modeOptions = {
    time: [23, 59],
    date: [200, 11, 30]
  }

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

  function getTimePickerData () {
    let list = []
    for (let i = 0; i < 60; i++) {
      let temp = i < 10 ? `0${i}` : i
      list.push(temp)
    }
    return [list.slice(0, 24), list]
  }

  function getDatePickerData (fields) {
    let years = []
    let months = []
    let days = []

    for (let i = 0; i <= 200; i++) {
      years.push(`${startYear + i}年`)
    }
    if (fields === 'year') {
      return [years]
    }

    for (let i = 1; i <= 12; i++) {
      let temp = i < 10 ? `0${i}` : i
      months.push(`${temp}月`)
    }
    if (fields === 'month') {
      return [years, months]
    }

    for (let i = 1; i <= 31; i++) {
      let temp = i < 10 ? `0${i}` : i
      days.push(`${temp}日`)
    }
    return [years, months, days]
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
            case 'time':
              return ''
            case 'date':
              return ''
            default:
              return ''
          }
        }
      },
      start: {
        type: String,
        default: '1970-01-01'
      },
      end: {
        type: String,
        default: '2100-01-01'
      },
      fields: {
        type: String,
        default: 'day'
      },
      scrollOptions: {
        type: Object,
        default: () => {
          return {}
        }
      }
    },
    data () {
      return {
        isShow: false,
        startIndex: [0, 0, 0],
        endIndex: [0, 0, 0],
        itemHeight: 0
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
          case 'time':
            return getTimePickerData()
          case 'date':
            return getDatePickerData(this.fields)
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
          let valueTemp = []
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
            case 'time':
              this.selectedIndex = []
              if (!this.value)  {
                valueTemp = [new Date().getHours(), new Date().getMinutes()]
              } else {
                valueTemp = this.value && this.value.split(':')
              }
              for (let i = 0; i < valueTemp.length; i++) {
                this.selectedIndex[i] = valueTemp[i] || 0
              }
              break
            case 'date':
              this.selectedIndex = []
              if (!this.value)  {
                valueTemp = [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()]
              } else {
                valueTemp = this.value && this.value.split('-')
              }
              let result = Object.keys(this.pickerData[0]).filter(item => startYear + Number(item) === Number(valueTemp[0]))
              this.selectedIndex[0] = Number(result[0])
              for (let i = 1; i < valueTemp.length; i++) {
                this.selectedIndex[i] = valueTemp[i] - 1
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
      this.initRangeIndex()
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
        let value = ''
        let valueTemp = []
        switch (this.mode) {
          case 'selector':
            value = this.selectedIndex[0]
            break
          case 'multiSelector':
            value = this.selectedIndex.slice()
            break
          case 'time':
            for (let i = 0; i < this.selectedIndex.length; i++) {
              valueTemp[i] = this.selectedIndex[i] < 10 ? `0${Number(this.selectedIndex[i])}` : `${this.selectedIndex[i]}`
            }
            value = `${valueTemp[0]}:${valueTemp[1]}`
            break
          case 'date':
            let year = this.pickerData[0][this.selectedIndex[0]].replace('年', '')
            if (this.fields === 'year') {
              value = `${year}`
              break
            }

            let month = this.selectedIndex[1] < 9 ? `0${this.selectedIndex[1] + 1}` : this.selectedIndex[1] + 1
            if (this.fields === 'month') {
              value = `${year}-${month}`
              break
            }

            let day = this.selectedIndex[2] < 9 ? `0${this.selectedIndex[2] + 1}` : this.selectedIndex[2] + 1
            value = `${year}-${month}-${day}`
            break
          default:
            value = this.selectedIndex[0]
        }
        this.$emit('change', getCustomEvent('change', {value}, this))
      },
      _cancel () {
        this.hide()
        this.$emit('cancel', getCustomEvent('cancel', {}, this))
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
              this.selectedIndex[i] = +this.selectedIndex[i] || 0
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
                  probeType: 3,
                  bindToWrapper: true,
                  ...this.scrollOptions
                })
                if (this.mode === 'time' || this.mode === 'date') {
                  this.wheels[i].on('scrollStart', function (i) {
                    this.handleScrollStart()
                  }.bind(this, i))
                }
                this.wheels[i].on('scrollEnd', function (i) {
                  if (this.refreshing) return
                  const currentIndex = this.wheels[i].getSelectedIndex()
                  if (this.selectedIndex[i] !== currentIndex) {
                    this.selectedIndex[i] = currentIndex
                    if (this.mode === 'multiSelector') {
                      this.$emit('columnchange', getCustomEvent('columnchange', {
                        column: i,
                        value: currentIndex
                      }, this))
                    }
                  }
                  if (this.mode === 'time' || this.mode === 'date') {
                    this.handleScrollEnd()
                  }
                }.bind(this, i))
              }
            }
            if (this.mode === 'time' || this.mode === 'date') {
              this.initWheelPosition()
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
      },
      initRangeIndex () {
        if (this.mode !== 'time' && this.mode !== 'date') {
          return
        }

        this.itemHeight = window.getComputedStyle(document.getElementsByClassName('wheel-item')[0]).height.replace(/px/g, '')
        if (this.mode === 'time') {
          this.startIndex = [this.getIndex('start', 0, ':'), this.getIndex('start', 1, ':')]
          this.endIndex = [this.getIndex('end', 0, ':'), this.getIndex('end', 1, ':')]
        }
        if (this.mode === 'date') {
          this.startIndex = [this.getIndex('start', 0, '-') - startYear, this.getIndex('start', 1, '-') - 1, this.getIndex('start', 2, '-') - 1]
          this.endIndex = [this.getIndex('end', 0, '-') - startYear, this.getIndex('end', 1, '-') - 1, this.getIndex('end', 2, '-') - 1]
        }
      },
      getIndex (type, i, delimiter) {
        return this[type] && Number(this[type].split(delimiter)[i])
      },
      handleScrollStart () {
        // 重置可滚动距离
        for (let i = 0; i < this.wheels.length; i++) {
          this.wheels[i].minScrollY = 0
          this.wheels[i].maxScrollY = -(modeOptions[this.mode][i] * this.itemHeight)
        }
        //开始滚动 判断最多可滚动距离
        if (this.start) {
          this.wheels[0].minScrollY = -(this.startIndex[0] * this.itemHeight)

          for (let i = 0; i < this.wheels.length; i++) {
            if (!(this.wheels[i + 1] && this.wheels[i].getSelectedIndex() === this.startIndex[i])) {
              break
            }
            this.wheels[i + 1].minScrollY = -(this.startIndex[i + 1] * this.itemHeight)
            this.wheels[i + 1].maxScrollY = -(modeOptions[this.mode][i + 1] * this.itemHeight)
          }
        }
        if (this.end) {
          this.wheels[0].maxScrollY = -(this.endIndex[0] * this.itemHeight)

          for (let i = 0; i < this.wheels.length; i++) {
            if (!(this.wheels[i + 1] && this.wheels[i].getSelectedIndex() === this.endIndex[i])) {
              break
            }
            this.wheels[i + 1].minScrollY = 0
            this.wheels[i + 1].maxScrollY = -(this.endIndex[i + 1] * this.itemHeight)
          }
        }
      },
      handleScrollEnd () {
        const solarMonths = [1, 3, 5, 7, 8, 10, 12]
        if (this.start) {
          for (let i = 0; i < this.wheels.length; i++) {
            if (!(this.wheels[i].getSelectedIndex() === this.startIndex[i]) || !(this.wheels[i + 1])) {
              break
            }
            if (this.wheels[i + 1].getSelectedIndex() < this.startIndex[i + 1]) {
              this.wheels[i + 1].minScrollY = 0
              this.wheels[i + 1].maxScrollY = -(modeOptions[this.mode][i+1] * this.itemHeight)
              this.wheels[i + 1].wheelTo([this.startIndex[i + 1]])
            }
          }
        }
        if (this.end) {
          for (let i = 0; i < this.wheels.length; i++) {
            if (!(this.wheels[i].getSelectedIndex() === this.endIndex[i]) || !(this.wheels[i + 1])) {
              break
            }
            if (this.wheels[i + 1].getSelectedIndex() > this.endIndex[i + 1]) {
              this.wheels[i + 1].minScrollY = 0
              this.wheels[i + 1].maxScrollY = -(modeOptions[this.mode][i+1] * this.itemHeight)
              this.wheels[i + 1].wheelTo([this.endIndex[i + 1]])
            }
          }
        }
        // 单独处理小月30天，2月28天或29天情况
        if (this.mode === 'date' && this.fields === 'day' && !solarMonths.includes(this.wheels[1].getSelectedIndex() + 1)) {
          const currentYear = this.wheels[0].getSelectedIndex() + startYear
          const isFebruary = this.wheels[1].getSelectedIndex() === 1
          const isLeapYear = (currentYear % 4 === 0 && (currentYear % 100 !== 0)) || (currentYear % 400 === 0)
          const day = isFebruary && (isLeapYear ? 28 : 27) || 29
          this.wheels[2].getSelectedIndex() > day && this.wheels[2].wheelTo([0])
        }

      },
      initWheelPosition () {
        if (this.start) {
          if (this.wheels[0].getSelectedIndex() < this.startIndex[0]) {
            for (let i = 0; i < this.wheels.length; i++) {
              this.wheels[i].wheelTo([this.startIndex[i]])
              this.selectedIndex[i] = this.startIndex[i] || 0
            }
          } else {
            for (let i = 0; i < this.wheels.length; i++) {
              if (this.wheels[i].getSelectedIndex() !== this.startIndex[i]) {
                break
              }
              if (this.wheels[i+1] && this.wheels[i+1].getSelectedIndex() < this.startIndex[i+1]) {
                for (let j = i+1; j < this.wheels.length; j++) {
                  this.wheels[j].wheelTo([this.startIndex[j]])
                  this.selectedIndex[j] = this.startIndex[j] || 0
                }
              }
            }
          }
        }
        if (this.end) {
          if (this.wheels[0].getSelectedIndex() > this.endIndex[0]) {
            for (let i = 0; i < this.wheels.length; i++) {
              this.wheels[i].wheelTo([this.endIndex[i]])
              this.selectedIndex[i] = this.endIndex[i] || 0
            }
          } else {
            for (let i = 0; i < this.wheels.length; i++) {
              if (this.wheels[i].getSelectedIndex() !== this.endIndex[i]) {
                break
              }
              if (this.wheels[i+1] && this.wheels[i+1].getSelectedIndex() > this.endIndex[i+1]) {
                for (let j = i+1; j < this.wheels.length; j++) {
                  this.wheels[j].wheelTo([this.endIndex[j]])
                  this.selectedIndex[j] = this.endIndex[j] || 0
                }
              }
            }
          }
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
