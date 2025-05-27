<template>
    <div class="mpx-movable-area-container" ref="movableArea">
        <div class="mpx-movable-scroll-wrapper" ref="scroll">
            <slot></slot>
        </div>
    </div>
</template>

<script type="text/ecmascript-6">
  export default {
    data () {
      return {}
    },
    mounted () {
      this.computedStyle()
    },
    beforeDestroy () {

    },
    methods: {
      computedStyle() {
        const style = this.$refs.movableArea.getBoundingClientRect()
        if (!style.width) {
          this.$refs.movableArea.style.width = '10px'
        }
        if (!style.height) {
          this.$refs.movableArea.style.height = '10px'
        }
      }
    }
  }
</script>
<style lang="stylus" rel="stylesheet/stylus" scoped>
    .mpx-movable-area-container
        position: relative
        .mpx-movable-scroll-wrapper
            position: absolute
            top: 0
            left: 0
            bottom: 0
            right: 0
</style>
