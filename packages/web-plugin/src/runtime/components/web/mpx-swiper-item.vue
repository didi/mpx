<script>
  import getInnerListeners from './get-inner-listeners'

  export default {
    name: 'mpx-swiper-item',
    props: {
      itemId: String
    },
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
</style>
