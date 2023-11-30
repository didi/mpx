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
    activated () {
      this.computedStyle()
    },
    methods: {
      computedStyle() {
        const style = this.$refs.movableArea.getBoundingClientRect()
        if (!style.width) {
          this.$refs.movableArea.style.minWidth = '10px'
        } else {
          this.$refs.movableArea.style.minWidth = '0px'
        }
        if (!style.height) {
          this.$refs.movableArea.style.minHeight = '10px'
        } else {
          this.$refs.movableArea.style.minHeight = '0px'
        }
      }
    }
  }
</script>
<style lang="stylus" rel="stylesheet/stylus" scoped>
    .mpx-movable-area-container
        position: absolute
        .mpx-movable-scroll-wrapper
            position: absolute
            top: 0
            left: 0
            bottom: 0
            right: 0
</style>
