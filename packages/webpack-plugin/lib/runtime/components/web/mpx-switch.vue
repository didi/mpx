<script>
  import getInnerListeners, { getCustomEvent } from './getInnerListeners'


  export default {
    name: 'mpx-switch',
    props: {
      type: {
        type: String,
        default: 'switch'
      },
      checked: {
        type: Boolean,
        default: false
      },
      disabled: {
        type: Boolean,
        default: false
      },
      color: {
        type: String,
        default: '#04BE02'
      }
    },
    data () {
      return {
        switchChecked: this.checked
      }
    },
    render (createElement) {
      let children = []
      const domProps = {
        type: 'checkbox',
        checked: this.checked,
        disabled: this.disabled
      }
      
      const checkbox = createElement('input', {
        class: 'mpx-switch-checkbox',
        on: {
          change: (event) => {
            this.switchChecked = event.target.checked
            this.$emit('change', getCustomEvent('change', { value: this.switchChecked }))
          }
        },
        domProps
      })
      children.push(checkbox)
      if (this.type === 'switch') {
        const switchElem = createElement('div', {
          class: ['mpx-switch-label', this.switchChecked ? 'checked-switch-label' : 'uncheck-switch-label'],
          style: this.switchChecked ? {
            borderColor: this.color,
            background: this.color
          } : {}
        })
        children.push(switchElem)
      }
      
      children.push(...(this.$slots.default || []))

      const data = {
        class: [this.type === 'switch' ? 'mpx-switch-wrap' : 'mpx-checkbox-wrap'],
        on: getInnerListeners(this, { ignoredListeners: ['change'] })
      }
      return createElement('div', data, children)
    }
  }
</script>

<style lang="stylus">
  .mpx-checkbox-wrap
    display: inline-flex
  .mpx-switch-wrap
    display: inline-flex
    width: 52px
    height: 32px
    position: relative
    .mpx-switch-checkbox
      position: absolute
      width: 100%
      height: 100%
      z-index: 2
      opacity: 0
    .mpx-switch-label
      width: 52px
      height: 32px
      border-radius: 16px
      border: 1px solid #DFDFDF
      &.checked-switch-label
        &:before
          transform: scale(0)
        &:after
          transform: translateX(18px)
      &:before
        content: " "
        position: absolute
        width: 50px
        height: 30px
        border-radius: 15px
        background-color: #FDFDFD
        transition: transform 0.3s
      &:after
        width: 32px
        height: 32px
        position: absolute
        left: 1px
        top: 1px
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4)
        background: #fff
        display: inline-block
        content: ""
        border-radius: 100%
        transition: transform 0.3s, -webkit-transform 0.3s
</style>
