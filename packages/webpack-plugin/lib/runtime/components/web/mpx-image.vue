<script>
  export default {
    name: 'mpx-image',
    props: {
      src: {
        type: String
      },
      mode: {
        type: String,
        default: 'scaleToFill'
      },
      lazyLoad: {
        type: Boolean,
        default: false
      },
      showMenuByLongpress: {
        type: Boolean,
        default: false
      }
    },
    beforeCreate () {
      this.image = new Image()
      this.image.onload = (e) => {
        this.$emit('load', e)
      }
      this.image.onerror = (e) => {
        this.$emit('error', e)
      }
    },
    watch: {
      src: {
        handler (src) {
          this.image.src = src
        },
        immediate: true
      }
    },
    render (createElement) {
      let backgroundSize = ''
      let backgroundPosition = ''
      const style = {
        backgroundImage: `url(${this.src})`
      }
      switch (this.mode) {
        case 'scaleToFill':
          backgroundSize = '100% 100%'
          break
        case 'aspectFit':
          backgroundSize = 'contain'
          break
        case 'aspectFill':
          backgroundSize = 'cover'
          break
        case 'top':
        case 'bottom':
        case 'center':
        case 'left':
        case 'right':
        case 'top left':
        case 'top right':
        case 'bottom left':
        case 'bottom right':
          backgroundPosition = this.mode
          break
      }

      if (backgroundSize) {
        style.backgroundSize = backgroundSize
      }
      if (backgroundPosition) {
        style.backgroundPosition = backgroundPosition
      }
      return createElement('div', {
        style,
        class: ['mpx-image']
      })
    }
  }
</script>

<style lang="stylus">
  .mpx-image
    width 300px
    height 225px
    display inline-block
</style>

