<script>
  import getInnerListeners, { getCustomEvent } from './getInnerListeners'
  import { processSize } from '../../utils'

  export default {
    name: 'mpx-progress',
    props: {
      percent: {
        type: Number,
        default: 0
      },
      showInfo: {
        type: Boolean,
        default: false
      },
      borderRadius: {
        type: [Number, String],
        default: 0
      },
      fontSize: {
        type: [Number, String],
        default: 16
      },
      strokeWidth: {
        type: [Number, String],
        default: 6
      },
      color: {
        type: String,
        default: '#09BB07'
      },
      activeColor: {
        type: String,
        default: '#09BB07'
      },
      backgroundColor: {
        type: String,
        default: '#EBEBEB'
      },
      active: {
        type: Boolean,
        default: false
      },
      activeMode: {
        type: String,
        default: 'backwards'
      },
      duration: {
        type: Number,
        default: 30
      }
    },
    data () {
      return {
        innerPercent: 0,
        transition: 'none'
      }
    },
    computed: {
      _borderRadius () {
        return processSize(this.borderRadius)
      },
      _fontSize () {
        return processSize(this.fontSize)
      },
      _strokeWidth () {
        return processSize(this.strokeWidth)
      }
    },
    mounted () {
      this.$watch(() => {
        return this.percent
      }, () => {
        if (this.active) {
          this.doTransition()
        } else {
          this.innerPercent = this.percent
        }
      }, {
        immediate: true
      })
    },
    methods: {
      doTransition () {
        const from = this.activeMode === 'backwards' ? 0 : this.innerPercent
        const to = this.percent
        const duration = this.duration * Math.abs(to - from)
        this.innerPercent = from
        this.transition = 'none'
        setTimeout(() => {
          this.innerPercent = to
          this.transition = `all ${duration}ms`
        })
      },
      resetTransition () {
        this.transition = 'none'
      }
    },
    render (createElement) {
      const children = []
      const strokeWidthStr = this._strokeWidth + 'px'
      const fontSizeStr = this._fontSize + 'px'
      const borderRadiusStr = this._borderRadius + 'px'

      const progress = createElement('div', {
        class: 'progress',
        style: {
          height: strokeWidthStr,
          backgroundColor: this.activeColor || this.color,
          transform: `scaleX(${this.innerPercent / 100})`,
          transition: this.transition
        },
        ref: 'progress',
        on: {
          transitionend: () => {
            this.$emit('activeend', getCustomEvent('activeend', {
              curPercent: this.percent
            }, this))
          }
        }
      })
      const progressContainer = createElement('div', {
        class: 'container',
        style: {
          height: strokeWidthStr,
          borderRadius: borderRadiusStr,
          backgroundColor: this.backgroundColor
        }
      }, [progress])

      children.push(progressContainer)
      if (this.showInfo) {
        const info = createElement('div', {
          class: 'info',
          style: {
            fontSize: fontSizeStr
          }
        }, this.innerPercent + '%')
        children.push(info)
      }

      children.push(...(this.$slots.default || []))

      const data = {
        class: ['mpx-progress'],
        on: getInnerListeners(this, { ignoredListeners: ['activeend'] })
      }
      return createElement('div', data, children)
    }
  }
</script>

<style lang="stylus">
  .mpx-progress
    display flex
    align-items center
    margin 10px

    .container
      flex: 1
      position relative
      overflow hidden
      height: 3px

    .progress
      position absolute
      top 0
      left 0
      width 100%
      transform-origin 0 0
      height: 100%

    .info
      padding-left 20px
</style>
