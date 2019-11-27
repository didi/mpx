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
        default: 50
      },
      hoverStayTime: {
        type: Number,
        default: 400
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
      return createElement('button', data, this.$slots.default)
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
          clearTimeout(this.endTimer)
        }, this.hoverStartTime)
      },
      handleTouchend () {
        clearTimeout(this.endTimer)
        this.endTimer = setTimeout(() => {
          this.hover = false
          clearTimeout(this.startTimer)
        }, this.hoverStayTime)
      }
    }
  }
</script>
