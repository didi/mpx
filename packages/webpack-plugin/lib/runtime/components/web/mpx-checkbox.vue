<script>
  import getInnerListeners from './getInnerListeners'

  export default {
    name: 'mpx-checkbox',
    props: {
      value: {
        type: String,
        default: ''
      },
      disabled: Boolean,
      checked: Boolean,
      color: {
        type: String,
        default: '#09BB07'
      }
    },
    render (createElement) {
      const mergeAfter = {
        listeners: {
          change: () => {
            if (this.group) {
              this.group.notifyChange()
            }
          }
        },
        force: true
      }

      const domProps = {
        value: this.value,
        type: 'checkbox',
        checked: this.checked,
        disabled: this.disabled
      }


      const data = {
        class: 'mpx-checkbox',
        on: getInnerListeners(this, { mergeAfter }),
        domProps
      }
      return createElement('input', data, this.$slots.default)
    }
  }
</script>

<style lang="stylus">
  .mpx-checkbox
    margin 3px 3px 3px 4px
</style>
