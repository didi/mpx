<script>
  import getInnerListeners from './getInnerListeners'
  import * as perf from '@mpxjs/perf'

  export default {
    name: 'mpx-view',
    data () {
      return {
        hover: false
      }
    },
    props: {
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
        default: 400
      }
    },
    render (createElement) {
      let id = -1
      if (__mpx_perf_framework__) id = perf.scopeStart('view:render')
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
      const data = {
        class: ['mpx-view', this.className],
        on: getInnerListeners(this, { mergeAfter })
      }
      const result = createElement('div', data, this.$slots.default)
      if (__mpx_perf_framework__) perf.scopeEnd(id)
      return result
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
