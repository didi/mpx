<script>
  export default {
    name: 'mpx-sticky-section',
    render(h) {
      const style = {
        position: 'relative'
      }

      return h('div', {
        style,
        class: 'mpx-sticky-section'
      }, this.$slots.default)
    }
  }
</script>