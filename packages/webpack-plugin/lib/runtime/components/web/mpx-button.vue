<script>
  import getInnerListeners from '@mpxjs/webpack-plugin/lib/runtime/components/web/getInnerListeners'

  export default {
    name: 'mpx-button',
    data () {
      return {
        hover: false
      }
    },
    props: {
      // todo 封装支持相关props
      name: String,
      size: {
        type: String,
        default: 'default'
      },
      type: {
        type: String,
        default: 'default'
      },
      plain: Boolean,
      disabled: Boolean,
      loading: String,
      formType: String,
      hoverClass: {
        type: String,
        default: 'button-hover'
      },
      hoverStopPropagation: {
        type: Boolean,
        default: false
      },
      hoverStartTime: {
        type: Number,
        default: 20
      },
      hoverStayTime: {
        type: Number,
        default: 70
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
    mounted () {
      if (this.formType) {
        this.$on('tap', () => {
          if (this.form && this.form[this.formType]) {
            this.form[this.formType]()
          }
        })
      }
    },
    render (createElement) {
      let mergeAfter
      if (this.hoverClass && this.hoverClass !== 'none') {
        mergeAfter = {
          listeners: {
            touchstart: this.handleTouchstart,
            touchend: this.handleTouchend
          },
          force: true
        }
      }
      const attrs = {
        name: this.name
      }
      const data = {
        class: ['mpx-button', this.className],
        attrs,
        on: getInnerListeners(this, {
          mergeAfter,
          // 由于当前机制下tap事件只有存在tap监听才会触发，为了确保该组件能够触发tap，传递一个包含tap的defaultListeners用于模拟存在tap监听
          defaultListeners: {
            tap () {
            }
          }
        })
      }
      return createElement('div', data, this.$slots.default)
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
        }, this.hoverStartTime)
      },
      handleTouchend () {
        clearTimeout(this.endTimer)
        this.endTimer = setTimeout(() => {
          this.hover = false
        }, this.hoverStayTime)
      }
    }
  }
</script>

<style lang="stylus">
  .mpx-button
    position relative
    display block
    margin-left auto
    margin-right auto
    padding-left 14px
    padding-right 14px
    box-sizing border-box
    font-size 18px
    text-align center
    text-decoration none
    line-height 2.55555556
    border-radius 5px
    -webkit-tap-highlight-color transparent
    overflow hidden
    color #000
    background-color #f8f8f8

    &:after
      content " "
      width 200%
      height 200%
      position absolute
      top 0
      left 0
      border 1px solid rgba(0, 0, 0, .2)
      -webkit-transform scale(.5)
      transform scale(.5)
      -webkit-transform-origin 0 0
      transform-origin 0 0
      box-sizing border-box
      border-radius 10px

    &.button-hover
      color rgba(0, 0, 0, .6)
      background-color #dedede
</style>
