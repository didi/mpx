<template>
  <div :class="className" class="mpx-view" @touchstart="handleTouchstart" @touchend="handleTouchend">
    <slot/>
  </div>
</template>

<script>
  export default {
    name: 'mpx-view',
    data () {
      return {
        hover: false
      }
    },
    props: {
      hoverClass: {
        type: String,
        default: 'none'
      },
      hoverStopPropagation: {
        type: Boolean,
        default: false
      },
      hoverStartTime: {
        type: Number,
        default: 50
      },
      hoverStayTime: {
        type: Number,
        default: 400
      }
    },
    computed: {
      className () {
        if (this.hoverClass && this.hoverClass !== 'none' && this.hover) {
          return this.hoverClass
        }
        return ''
      }
    },
    methods: {
      handleTouchstart (e) {
        if (e.__hoverStopPropagation) {
          return
        }
        e.__hoverStopPropagation = this.hoverStopPropagation
        clearTimeout(this.startTimer)
        this.startTimer = setTimeout(() => {
          this.hover = true
          clearTimeout(this.endTimer)
        }, this.hoverStartTime)
      },
      handleTouchend () {
        clearTimeout(this.endTimer)
        this.endTimer = setTimeout(() => {
          this.hover = false
          clearTimeout(this.startTimer)
        }, this.hoverStayTime)
      }
    }
  }
</script>
