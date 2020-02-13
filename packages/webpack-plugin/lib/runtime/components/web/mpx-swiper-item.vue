<script>
  import getInnerListeners from './getInnerListeners'

  export default {
    name: 'mpx-swiper-item',
    render (createElement) {
      const data = {
        class: 'mpx-swiper-item',
        on: getInnerListeners(this)
      }
      return createElement('div', data, this.$slots.default)
    }
  }
</script>

<style lang="stylus">
  .mpx-swiper-item
    width 100%
    height 100%
</style>
