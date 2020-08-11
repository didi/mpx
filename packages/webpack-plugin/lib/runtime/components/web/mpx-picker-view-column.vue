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

  BScroll.use(Wheel)

  export default {
    name: 'mpx-picker-view-column',
    props: {
      value: Array
    },
    data() {
      return {
        wheels: [],
        selectedIndex: [0]
      }
    },
    computed: {},
    watch: {},
    mounted() {
      this.wheels = []
      this.refresh()
      for (let i = 0; i < this.$refs.wheelScroll.children.length; i++) {
        this.$refs.wheelScroll.children[i].style.height = `${this.$parent.$refs.indicatorMask.offsetHeight}px`
      }
    },
    beforeDestroy() {
      this.wheels.forEach((wheel) => {
        wheel.destroy()
      })
      this.wheels = []
    },
    methods: {
      refresh() {
        if (this.refreshing) return
        this.refreshing = true
        this.$nextTick(() => {
          const wheelWrapper = this.$refs.wheelWrapper
          this.wheels[0] = new BScroll(wheelWrapper, {
            wheel: {
              selectedIndex: this.selectedIndex[0],
              rotate: -5,
              wheelWrapperClass: 'wheel-scroll'
            },
            probeType: 3
          })
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
