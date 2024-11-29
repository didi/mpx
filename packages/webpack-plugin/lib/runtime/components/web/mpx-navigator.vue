<script>
  import getInnerListeners from './getInnerListeners'

  export default {
    name: 'mpx-navigator',
    data () {
      return {
        hover: false
      }
    },
    props: {
      url: String,
      openType: {
        type: String,
        default: 'navigate'
      },
      delta: {
        type: Number,
        default: 1
      },
      hoverClass: {
        type: String,
        default: 'none'
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
        default: 600
      }
    },
    mounted () {
      this.$el.addEventListener('tap', () => {
        const mpx = global.__mpx
        if (mpx) {
          switch (this.openType) {
            case 'navigateBack':
              mpx.navigateBack && mpx.navigateBack({
                delta: this.delta
              })
              break
            case 'reLaunch':
              mpx.reLaunch && mpx.reLaunch({
                url: this.url
              })
              break
            case 'switchTab':
              mpx.switchTab && mpx.switchTab({
                url: this.url
              })
              break
          }
        }
      })
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
      let tagName = 'a'
      const props = {}
      const domProps = {}
      if (this.openType === 'navigate' || this.openType === 'redirect') {
        tagName = 'router-link'
        props.to = this.url
        if (this.openType === 'redirect') {
          props.replace = true
        }
      } else {
        domProps.href = 'javascript:void(0);'
      }
      const data = {
        class: ['mpx-navigator', this.className],
        props,
        domProps,
        on: getInnerListeners(this, {
          mergeAfter,
          // 由于当前机制下tap事件只有存在tap监听才会触发，为了确保该组件能够触发tap，传递一个包含tap的defaultListeners用于模拟存在tap监听
          defaultListeners: ['tap']
        })
      }
      return createElement(tagName, data, this.$slots.default)
    },
    computed: {
      className () {
        if (this.hoverClass && this.hoverClass !== 'none' && this.hover) {
          return this.hoverClass
        }
        return ''
      }
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
