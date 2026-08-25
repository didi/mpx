<script>
  import getInnerListeners, { getCustomEvent } from './getInnerListeners'
  import { isBrowser } from '../../env'
  import * as perf from '@mpxjs/perf'

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
      if (isBrowser) {
        this.image = new Image()
        this.image.onload = () => {
          this.$emit('load', getCustomEvent('load', {
            width: this.image.width,
            height: this.image.height
          }, this))
        }
        this.image.onerror = () => {
          this.$emit('error', getCustomEvent('error', {}, this))
        }
      }
    },
    watch: {
      src: {
        handler (src) {
          if (src && this.image) this.image.src = src
        },
        immediate: true
      }
    },
    render (createElement) {
      let id = -1
      if (__mpx_perf_framework__) id = perf.scopeStart('image:render')
      let result
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
        result = createElement('img', {
          domProps,
          style,
          class: ['mpx-image'],
          on: getInnerListeners(this, { ignoredListeners: ['load', 'error'] })
        })
      } else {
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
        result = createElement('div', {
          style,
          class: ['mpx-image'],
          on: getInnerListeners(this, { ignoredListeners: ['load', 'error'] })
        })
      }
      if (__mpx_perf_framework__) perf.scopeEnd(id)
      return result
    }
  }
</script>

<style lang="stylus">
  .mpx-image
    width 300px
    height 225px
    display inline-block
</style>
