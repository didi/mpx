<script>
  import getInnerListeners, { extendEvent } from './getInnerListeners'

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
    },
    watch: {
      src: {
        handler (src) {
          if (src) this.image.src = src
        },
        immediate: true
      }
    },
    mounted () {
      const el = this.$el || {}
      const targetInfo = {
        id: el?.id || '',
        dataset: el?.dataset || {},
        offsetTop: el?.offsetTop || 0,
        offsetLeft: el?.offsetLeft || 0,
      }
      this.image.onload = (e) => {
        extendEvent(e, {
          detail: {
            width: this.image.width,
            height: this.image.height
          },
          target: targetInfo,
          currentTarget: targetInfo
        })

        this.$emit('load', e)
      }
      this.image.onerror = (e) => {
        extendEvent(e, {
          target: targetInfo,
          currentTarget: targetInfo
        })
        this.$emit('error', e)
      }
    },
    render (createElement) {
      if (this.mode === 'widthFix' || this.mode === 'heightFix') {
        let style
        if (this.mode === 'widthFix') {
           style = {
             height: 'auto'
           }
        } else {
          style = {
            width: 'auto'
          }
        }
        const domProps = {}
        if (this.src) domProps.src = this.src
        return createElement('img', {
          domProps,
          style,
          class: ['mpx-image'],
          on: getInnerListeners(this, { ignoredListeners: ['load', 'error'] })
        })
      }

      const style = {}
      if (this.src) {
        style.backgroundImage = `url(${this.src})`
        switch (this.mode) {
          case 'scaleToFill':
            style.backgroundSize = '100% 100%'
            break
          case 'aspectFit':
            style.backgroundSize = 'contain'
            style.backgroundPosition = 'center'
            style.backgroundRepeat = 'no-repeat'
            break
          case 'aspectFill':
            style.backgroundSize = 'cover'
            style.backgroundPosition = 'center'
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
            style.backgroundPosition = this.mode
            break
        }
      }
      return createElement('div', {
        style,
        class: ['mpx-image'],
        on: getInnerListeners(this, { ignoredListeners: ['load', 'error'] })
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

