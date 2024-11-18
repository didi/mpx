<script>
  import getInnerListeners, { getCustomEvent } from '@mpxjs/webpack-plugin/lib/runtime/components/web/getInnerListeners'


  export default {
    name: 'mpx-slider',
    data () {
      return {
        isDrag: false,
        startX: 0,
        sliderWidth: 0,
        sliderValue: this.value < this.min ? this.min : this.value > this.max ? this.max : this.value,
        stepWidth: 0
      }
    },
    props: {
      name: String,
      min: {
        type: Number,
        default: 0
      },
      max: {
        type: Number,
        default: 100
      },
      step: {
        type: Number,
        default: 1
      },
      value: {
        type: Number,
        default: 0
      },
      activeColor: {
        type: String,
        default: '#1aad19'
      },
      disabled: {
        type: Boolean,
        default: false
      },
      blockSize: {
        type: Number,
        default: 28
      },
      blockColor: {
        type: String,
        default: '#ffffff'
      },
      backgroundColor: {
        type: String,
        default: '#e9e9e9'
      },
      showValue: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      blockLeft () {
        const lineSum = this.max - this.min
        const lineRatio = (this.sliderValue - this.min) / lineSum
        return this.sliderWidth * lineRatio - this.blockSize / 2 + 'px' || 0
      }
    },
    mounted () {
      let sliderWrapEle = this.$refs.sliderWrap
      let width = window.getComputedStyle(sliderWrapEle, null).width
      this.sliderWidth = parseInt(width)
      this.startX = sliderWrapEle.getBoundingClientRect().left || 18
    },
    render (createElement) {
      let wrapChildren = []
      let children = []

      let sliderBg = createElement('div', {
        class: 'mpx-slider-bg',
        style: {
          backgroundColor: this.backgroundColor
        },
        ref: 'sliderWrap',
        on: {
          click: this.sliderClick
        }
      })
      wrapChildren.push(sliderBg)

      let sliderLine = createElement('div', {
        class: 'mpx-slider-line',
        style: {
          width: parseFloat(this.blockLeft) > 0 ? this.blockLeft : 0,
          top: `${(this.blockSize - 2) / 2}px`,
          backgroundColor: this.activeColor
        }
      })
      wrapChildren.push(sliderLine)
      let blockSize = (this.blockSize < 12 ? 12 :  this.blockSize > 28 ? 28 : this.blockSize) + 'px'
      let sliderBlock = createElement('div', {
        class: 'mpx-slider-block',
        style: {
          width: blockSize,
          height: blockSize,
          transform: `translate(${this.blockLeft}, -50%)`,
          transformOrigin: '50% 50%',
          backgroundColor: this.blockColor
        },
        on: {
          touchstart: this.sliderTouchStart,
          touchmove: this.sliderTouchMove,
          touchend: this.sliderTouchEnd
        }
      })
      wrapChildren.push(sliderBlock)
      wrapChildren.push(...(this.$slots.default || []))

      const sliderWrap = createElement('div', {
        style:{
          padding: `${(this.blockSize - 2) / 2}px 0`
        },
        class: 'mpx-slider-wrap'
      }, wrapChildren)
      children.push(sliderWrap)
      if (this.showValue) {
        let max = this.max.toString() || '100'
        let width = max.length * 10 + 'px'
        const sliderValue = createElement('div', {
          class: 'mpx-slider-value',
          domProps:{
            innerHTML: this.sliderValue
          },
          style: {
            width
          }
        })
        children.push(sliderValue)
      }
      children.push(...(this.$slots.default || []))

      const data = {
        class: ['mpx-slider'],
        ref: 'slider',
        on: getInnerListeners(this, { ignoredListeners: ['change', 'changing'] })
      }
      return createElement('div', data, children)
    },
    methods: {
      sliderTouchStart (event) {
        if (this.disabled) {
          return
        }
        this.isDrag = true
      },
      sliderTouchMove (event) {
        event.preventDefault()
        if (this.isDrag) {
          let eventName = 'changing'
          let moveStartX = event.targetTouches[0] && event.targetTouches[0].pageX
          this.setLineValue(moveStartX)
          this.$emit(eventName, getCustomEvent(eventName, { value: this.sliderValue }, this))
        }
      },
      sliderTouchEnd (event) {
        let eventName = 'change'
        this.$emit(eventName, getCustomEvent(eventName, { value: this.sliderValue }, this))
        this.isDrag = false
      },
      sliderClick (event) {
        if (this.disabled) {
          return
        }
        this.setLineValue(event.pageX)
        let eventName = 'change'
        this.$emit(eventName, getCustomEvent(eventName, { value: this.sliderValue }, this))
      },
      setLineValue (moveStartX) {
        moveStartX = moveStartX - this.startX
        let stepNum = (this.max - this.min) / this.step // 获取step分段数值
        let stepWidth = this.sliderWidth / stepNum // 获取每段长度
        let num = parseInt(moveStartX / stepWidth) // 获取已拖拽step分段数据
        if (num >= parseInt(stepNum) || num < 0) { // 检测超出范围部分
          return false
        }
        if (moveStartX % stepWidth > stepWidth / 2) { // 向左拖拽逻辑
          let width = (num + 1) * stepWidth > this.sliderWidth ? this.sliderWidth : (num + 1) * stepWidth
          this.sliderValue = this.min + (num + 1) * this.step // 设置展示值逻辑
        } else if (parseInt(this.blockLeft) - moveStartX) {  // 向右拖拽逻辑
          this.sliderValue = this.min + num * this.step // 设置展示值逻辑
        }
      },
      getValue () {
        return this.sliderValue
      },
      setValue (value) {
        value = value < this.min ? this.min : value > this.max ? this.max : value
        this.sliderValue = value
      },
      notifyChange (value) {
        if (value !== undefined) {
          this.setValue(value)
        } else {
          value = this.getValue()
        }
        this.$emit('change', getCustomEvent('change', { value: value }, this))
      }
    }
  }
</script>

<style lang="stylus">
  .mpx-slider
    margin: 0 18px
    display: flex
    align-items center
    .mpx-slider-wrap
      position: relative
      flex: 1
      height: 2px
    .mpx-slider-bg
      height: 2px
    .mpx-slider-line
      height: 2px
      position: absolute
      pointer-events: none
    .mpx-slider-block
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.2)
      width: 20px
      height: 20px
      border-radius: 100%
      position: absolute
      transform: translate(-50%, -50%)
      top: 50%
    .mpx-slider-value
      padding: 0 10px 0 20px
      color: #666
      text-align: center
</style>
